import asyncio
import re
import os
from datetime import datetime
from telegram.error import BadRequest
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from configparser import ConfigParser
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from fuzzywuzzy import fuzz 
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, filters,
    CallbackQueryHandler, ContextTypes, ConversationHandler
)
import tmdbsimple as tmdb
from transformers import MarianMTModel, MarianTokenizer #type: ignore
import html
from asyncio import Semaphore
from cachetools import TTLCache 
# После всех import
import logging
from pathlib import Path

# Создаём директорию для логов
log_dir = Path('logs')
log_dir.mkdir(exist_ok=True)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler(log_dir / 'bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Далее идут ваши константы BOT_TOKEN и т.д.

# Загрузка конфигурации
config = ConfigParser()
config.read('config.ini')

# Загрузка переменных окружения
load_dotenv()

# Константы
BOT_TOKEN = os.getenv("BOT_TOKEN")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
ITEMS_PER_PAGE = int(config.get('PAGINATION', 'items_per_page', fallback=10))
CACHE_EXPIRATION = int(config.get('CACHE', 'expiration_seconds', fallback=3600))
MAX_DESCRIPTION_LENGTH = int(config.get('CONTENT', 'max_description_length', fallback=200))
API_RATE_LIMIT = int(config.get('API', 'rate_limit', fallback=20))

# Состояния для ConversationHandler
CHOOSE_TYPE, CHOOSE_GENRE, CHOOSE_YEAR, CHOOSE_RATING, CHOOSE_COUNTRY, CHOOSE_SORT, SHOW_RESULTS = range(7)

# API Rate Limiting
API_SEMAPHORE = Semaphore(API_RATE_LIMIT)

MAX_TRANSLATION_ATTEMPTS = 3

# Настройка кэша с автоматическим истечением срока действия
search_cache = TTLCache(maxsize=100, ttl=CACHE_EXPIRATION)

# MongoDB setup
client = AsyncIOMotorClient(MONGO_URI)
db = client.movie_bot
cache_collection = db.cache

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    filename='bot.log'
)
logger = logging.getLogger(__name__)

# Проверка обязательных переменных окружения
for var_name, var_value in [("BOT_TOKEN", BOT_TOKEN), ("TMDB_API_KEY", TMDB_API_KEY)]:
    if not var_value:
        logger.error(f"{var_name} environment variable is not set.")
        exit(1)

tmdb.API_KEY = TMDB_API_KEY

# Расширенный словарь стран для перевода кодов ISO в русские названия
RU_COUNTRIES = {
    # Исторические страны
    "Советский Союз": "SU",  # СССР
    "Чехословакия": "CS",  # До распада в 1993
    "Югославия": "YU",  # До распада в 1992
    "Восточная Германия": "DD",  # До объединения Германии
    "Сербия и Черногория": "SCG",  # Существовала в 2003-2006
    
    # Колонии и зависимые территории
    "Гонконг (британская колония)": "HK-1997",  # До передачи Китаю
    "Макао (португальская колония)": "MO-1999",  # До передачи Китаю
    # Основные страны
    "США": "US",
    "Великобритания": "GB", 
    "Россия": "RU",
    "Франция": "FR",
    "Германия": "DE", 
    "Япония": "JP",
    "Китай": "CN",
    "Южная Корея": "KR",
    "Канада": "CA",
    "Италия": "IT",
    "Испания": "ES",
    "Индия": "IN",
    "Бразилия": "BR",
    "Мексика": "MX",
    "Австралия": "AU",
    
    # Европейские страны
    "Нидерланды": "NL",
    "Бельгия": "BE", 
    "Швеция": "SE",
    "Норвегия": "NO", 
    "Дания": "DK",
    "Финляндия": "FI",
    "Швейцария": "CH",
    "Австрия": "AT",
    "Греция": "GR",
    "Польша": "PL",
    "Чехия": "CZ",
    "Венгрия": "HU",
    "Португалия": "PT",
    "Ирландия": "IE",
    
    # Восточные страны
    "Тайвань": "TW", 
    "Гонконг": "HK",
    "Сингапур": "SG",
    "Индонезия": "ID",
    "Таиланд": "TH",
    
    # Ближний Восток
    "Израиль": "IL",
    "Турция": "TR",
    "ОАЭ": "AE",
    
    # Другие страны
    "Новая Зеландия": "NZ",
    "Аргентина": "AR",
    "Колумбия": "CO",
    "Чили": "CL",
    "Южная Африка": "ZA",
    "Египет": "EG"
}

# Перевернутый словарь для обратного поиска
ISO_TO_RU = {code: name for name, code in RU_COUNTRIES.items()}

async def get_directors(crew):
    """
    Получает список режиссеров с переводом или транслитерацией.
    
    Args:
        crew (list): Список участников съемочной группы
    
    Returns:
        str: Строка с именами режиссеров
    """
    directors = []
    for crew_member in crew:
        if crew_member.get('job', '').lower() in ['director', 'режиссер']:
            name = crew_member.get('name', '')
            if name:
                # Проверяем, содержит ли имя кириллицу
                if re.search('[а-яА-ЯёЁ]', name):
                    directors.append(escape_html(name))  # Если имя на русском, используем как есть
                else:
                    translated_name = await translation_service.translate(name)
                    if translation_service.is_valid_translation(name, translated_name):
                        directors.append(escape_html(translated_name))
                    else:
                        directors.append(escape_html(name))  # Если перевод некорректен, используем оригинал
    
    return ", ".join(directors) if directors else "Неизвестно"

def translate_country(iso_code):
    """
    Преобразует код страны в русское название.
    
    Args:
        iso_code (str): Код страны в формате ISO 3166-1
    
    Returns:
        str: Русское название страны или оригинальный код
    """
    if not iso_code:
        return None
    
    translated = ISO_TO_RU.get(iso_code, iso_code)
    return translated

def get_production_countries(production_countries):
    """
    Получает список стран производства с переводом.
    
    Args:
        production_countries (list): Список стран из ответа API
    
    Returns:
        str: Строка стран производства
    """
    if not production_countries:
        return "Информация о стране отсутствует"
    
    ru_countries = []
    for country in production_countries:
        iso_code = country.get('iso_3166_1')
        if iso_code:
            translated_country = translate_country(iso_code)
            if translated_country and translated_country not in ru_countries:
                ru_countries.append(translated_country)
    
    return ", ".join(ru_countries) if ru_countries else "Информация о стране отсутствует"

# Пример использования в функции show_movie_details
# countries = get_production_countries(response.get('production_countries', []))

# Оставить первое определение GENRES
GENRES = {
    # Сериалы и фильмы
    28: {"ru": "Боевик", "en": "Action"},
    12: {"ru": "Приключения", "en": "Adventure"},
    16: {"ru": "Мультфильм", "en": "Animation"},
    35: {"ru": "Комедия", "en": "Comedy"},
    80: {"ru": "Криминал", "en": "Crime"},
    99: {"ru": "Документальный", "en": "Documentary"},
    18: {"ru": "Драма", "en": "Drama"},
    10751: {"ru": "Семейный", "en": "Family"},
    14: {"ru": "Фэнтези", "en": "Fantasy"},
    36: {"ru": "История", "en": "History"},
    27: {"ru": "Ужасы", "en": "Horror"},
    10402: {"ru": "Музыка", "en": "Music"},
    9648: {"ru": "Мистика", "en": "Mystery"},
    10749: {"ru": "Романтика", "en": "Romance"},
    878: {"ru": "Фантастика", "en": "Science Fiction"},
    10770: {"ru": "Телевизионный фильм", "en": "TV Movie"},
    53: {"ru": "Триллер", "en": "Thriller"},
    10752: {"ru": "Военный", "en": "War"},
    37: {"ru": "Вестерн", "en": "Western"},

    # Дополнительные жанры для сериалов
    'Talk': {"ru": "Ток-шоу", "en": "Talk"},
    'News': {"ru": "Новости", "en": "News"},
}

# И оставить SERIES_GENRES
SERIES_GENRES = {
    10759: {"ru": "Боевик и Приключения", "en": "Action & Adventure"},
    16: {"ru": "Анимация", "en": "Animation"},
    35: {"ru": "Комедия", "en": "Comedy"},
    80: {"ru": "Криминал", "en": "Crime"},
    99: {"ru": "Документальный", "en": "Documentary"},
    18: {"ru": "Драма", "en": "Drama"},
    10751: {"ru": "Семейный", "en": "Family"},
    10762: {"ru": "Детский", "en": "Kids"},
    9648: {"ru": "Детектив", "en": "Mystery"},
    10763: {"ru": "Новости", "en": "News"},
    10764: {"ru": "Реалити-шоу", "en": "Reality"},
    10765: {"ru": "НФ и Фэнтези", "en": "Sci-Fi & Fantasy"},
    10766: {"ru": "Мыльная опера", "en": "Soap"},
    10767: {"ru": "Ток-шоу", "en": "Talk"},
    10768: {"ru": "Военный и Политика", "en": "War & Politics"},
    37: {"ru": "Вестерн", "en": "Western"}
}



def get_genre_name(genre_id_or_name, lang='ru'):
    """
    Получает название жанра с учетом русского и английского языков
    
    Args:
        genre_id_or_name (str/int): ID или название жанра
        lang (str): Язык ('ru' или 'en')
    
    Returns:
        str: Название жанра
    """
    if isinstance(genre_id_or_name, (int, str)):
        genre = GENRES.get(genre_id_or_name, {})
        return genre.get(lang, str(genre_id_or_name))
    
    # Если передано название жанра
    for genre_data in GENRES.values():
        if genre_id_or_name in genre_data.values():
            return genre_data.get(lang, genre_id_or_name)
    
    return genre_id_or_name


def get_genre_name(genre_id_or_name, lang='ru', media_type='movie'):
    """
    Получает название жанра с учетом русского и английского языков
    
    Args:
        genre_id_or_name (str/int): ID или название жанра
        lang (str): Язык ('ru' или 'en')
        media_type (str): Тип медиа ('movie' или 'tv')
    
    Returns:
        str: Название жанра
    """
    genres_dict = SERIES_GENRES if media_type == 'tv' else GENRES
    
    if isinstance(genre_id_or_name, (int, str)):
        genre = genres_dict.get(int(genre_id_or_name) if str(genre_id_or_name).isdigit() else genre_id_or_name, {})
        return genre.get(lang, str(genre_id_or_name))
    
    # Если передано название жанра
    for genre_data in genres_dict.values():
        if genre_id_or_name in genre_data.values():
            return genre_data.get(lang, genre_id_or_name)
    
    return genre_id_or_name

def format_genres(genres, lang='ru', media_type='movie'):
    """
    Форматирует список жанров для корректного отображения
    
    Args:
        genres (list): Список жанров
        lang (str): Язык вывода ('ru' или 'en')
        media_type (str): Тип медиа ('movie' или 'tv')
    
    Returns:
        str: Отформатированная строка жанров
    """
    formatted_genres = []
    for genre in genres:
        if isinstance(genre, dict):
            genre_id = genre.get('id')
            genre_name = genre.get('name')
            
            if genre_id is not None:
                formatted_genre = get_genre_name(genre_id, lang, media_type)
            elif genre_name is not None:
                formatted_genre = get_genre_name(genre_name, lang, media_type)
            else:
                continue
        else:
            formatted_genre = get_genre_name(genre, lang, media_type)
        
        formatted_genres.append(formatted_genre)
    
    # Удаляем дубликаты, сохраняя порядок
    unique_genres = []
    for genre in formatted_genres:
        if genre not in unique_genres:
            unique_genres.append(genre)
    
    return ", ".join(unique_genres)

# Обновляем методы с использованием новой функции

def escape_genre(genre):
    """Экранирование названия жанра"""
    return escape_html(get_genre_name(genre))

async def translate_name(name: str) -> str:
    """
    Переводит имя, если оно проходит проверку на корректность.
    """
    translated = await translation_service.translate(name)
    return translated
    return name

class TranslationService:
    def __init__(self):
        self.model_name = 'Helsinki-NLP/opus-mt-en-ru'
        self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
        self.model = MarianMTModel.from_pretrained(self.model_name)
        self.translation_cache = TTLCache(maxsize=1000, ttl=86400)

    async def translate(self, text: str) -> str:
        logger.info(f"Attempting to translate: {text}")
        
        if not isinstance(text, str):
            logger.warning(f"Invalid input type: {type(text)}")
            return text

        # Проверяем кэш
        if text in self.translation_cache:
            cached_result = self.translation_cache[text]
            logger.info(f"Cache hit: {text} -> {cached_result}")
            return cached_result

        MAX_TRANSLATION_ATTEMPTS = 3
        attempts = 0

        try:
            # Базовая валидация входного текста
            if not text or not text.strip():
                logger.warning("Empty text provided for translation")
                return text

            # Удаляем лишние пробелы
            text = text.strip()
            
            while attempts < MAX_TRANSLATION_ATTEMPTS:
                logger.info(f"Translation attempt {attempts + 1}")
                
                inputs = self.tokenizer([text], return_tensors='pt', padding=True, truncation=True)
                
                logger.info("Generating translation")
                translated = self.model.generate(**inputs)
                
                logger.info("Decoding translation")
                result = self.tokenizer.decode(translated[0], skip_special_tokens=True)
                
                logger.info(f"Translation result: {result}")
                
                # Проверяем результат
                if not result or not result.strip():
                    logger.warning("Empty translation result")
                    attempts += 1
                    continue

                # Дополнительная валидация результата
                if self.is_valid_translation(text, result):
                    # Сохраняем в кэш только валидные переводы
                    self.translation_cache[text] = result
                    logger.info(f"Successful translation: {text} -> {result}. Adding to cache.")
                    return result
                
                attempts += 1
                logger.warning(f"Invalid translation attempt for '{text}': {result}")
            
            # Если все попытки исчерпаны - возвращаем оригинальный текст
            logger.error(f"Failed to translate text after {MAX_TRANSLATION_ATTEMPTS} attempts: {text}")
            return text

        except Exception as e:
            logger.exception(f"Translation error for text '{text}': {str(e)}")
            return text

    def is_valid_translation(self, original: str, translated: str) -> bool:
        logger.info(f"Validating translation: {original} -> {translated}")
    
    # Проверяем минимальную длину результата
        if len(translated) < 2:
           logger.warning("Translation too short")
           return False
    
    # Проверяем соотношение длин
        if len(translated) > len(original) * 3 or len(translated) < len(original) / 3:
           logger.warning("Translation length ratio is off")
           return False
    
    # Проверка на повторяющиеся слоги/буквы
        if re.search(r'(\w)\1{3,}', translated, re.IGNORECASE):  # Изменено с {2,} на {3,}
           logger.warning("Translation contains repetitive characters")
           return False
    
    # Проверка на бессмысленные повторения
        if re.search(r'(пя|ля|ня|плю)(\-пя|\-ля|\-ня|\-плю){2,}', translated, re.IGNORECASE):  # Добавлена проверка на дефисы
           logger.warning("Translation contains meaningless repetitions")
           return False
    
    # Проверяем на наличие гласных букв в русском тексте
        if not re.search(r'[аеёиоуыэюя]', translated, re.IGNORECASE):
           logger.warning("Translation does not contain vowels")
           return False
    
    # Проверка на наличие согласных в русском тексте
        if not re.search(r'[бвгджзйклмнпрстфхцчшщ]', translated, re.IGNORECASE):
           logger.warning("Translation does not contain consonants")
           return False
    
    # Проверка на соответствие формату имени
        if any(char.isdigit() for char in translated):
           logger.warning("Translation contains digits")
           return False
        
    # Проверка на слишком длинные слова
        if any(len(word) > 20 for word in translated.split()):
           logger.warning("Translation contains too long words")
           return False
    
        logger.info("Translation passed validation")
        return True
    
    def clear_cache(self):
        logger.info("Clearing translation cache")
        self.translation_cache.clear()

# Создаем глобальный экземпляр сервиса перевода
translation_service = TranslationService()

async def rate_limited_api_call(func: callable, *args, **kwargs) -> Any:
    async with API_SEMAPHORE:
        try:
            return await asyncio.to_thread(func, *args, **kwargs)
        except Exception as e:
            logger.error(f"API call error: {e}")
            raise

async def get_media_details(media_id: str, media_type: str) -> Optional[Dict]:
    cache_key = f"{media_type}_{media_id}"
    
    cached_data = await cache_collection.find_one({"_id": cache_key})
    if cached_data and datetime.utcnow() - cached_data['timestamp'] < timedelta(seconds=CACHE_EXPIRATION):
        return cached_data['data']

    try:
        media = tmdb.Movies(media_id) if media_type == 'movie' else tmdb.TV(media_id)
        response = await rate_limited_api_call(media.info, language='ru')
        
        await cache_collection.update_one(
            {"_id": cache_key},
            {
                "$set": {
                    "data": response,
                    "timestamp": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        return response
    except Exception as e:
        logger.error(f"Error fetching {media_type} details: {e}")
        return None
    
async def translate_name(name: str) -> str:
    return await translation_service.translate(name)


def escape_html(text: str) -> str:
    return html.escape(str(text))

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    keyboard = [
        [InlineKeyboardButton("Поиск по названию", callback_data='search_by_title')],
        [InlineKeyboardButton("Поиск по фильтру", callback_data='search_by_filter')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "Добро пожаловать! Вы можете искать фильмы и сериалы двумя способами:\n"
        "1. Просто введите название фильма или сериала.\n"
        "2. Используйте команду /filter для поиска по параметрам.",
        reply_markup=reply_markup
    )

async def back_to_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data.clear()
    
    keyboard = [
        [InlineKeyboardButton("Поиск по названию", callback_data='search_by_title')],
        [InlineKeyboardButton("Поиск по фильтру", callback_data='search_by_filter')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await query.edit_message_text(
        "Вы можете искать фильмы и сериалы двумя способами:\n"
        "1. Просто введите название фильма или сериала.\n"
        "2. Используйте команду /filter для поиска по параметрам.",
        reply_markup=reply_markup
    )

async def handle_main_menu_selection(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Обрабатывает выбор пользователя в главном меню."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Main menu selection: {query.data}")
    
    if query.data == 'search_by_title':
        await query.edit_message_text("Введите название фильма или сериала:")
        return ConversationHandler.END
    
    elif query.data == 'search_by_filter':
        logger.info("Attempting to start filter search")
        keyboard = [
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
            [
                InlineKeyboardButton("🎬 Фильм", callback_data='type_movie'),
                InlineKeyboardButton("📺 Сериал", callback_data='type_series')
            ],
            [InlineKeyboardButton("🎬📺 Все", callback_data='type_all')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text('Выберите тип:', reply_markup=reply_markup)
        return CHOOSE_TYPE
    
    elif query.data == 'back_to_type':
        keyboard = [
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
            [
                InlineKeyboardButton("🎬 Фильм", callback_data='type_movie'),
                InlineKeyboardButton("📺 Сериал", callback_data='type_series')
            ],
            [InlineKeyboardButton("🎬📺 Все", callback_data='type_all')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text('Выберите тип:', reply_markup=reply_markup)
        return CHOOSE_TYPE

    logger.warning(f"Unhandled callback data: {query.data}")
    return ConversationHandler.END

async def tmdb_search(query: str) -> Optional[List[dict]]:
    if query in search_cache:
        return search_cache[query]
    
    try:
        search = tmdb.Search()
        response = await rate_limited_api_call(search.multi, query=query, language='ru')
        
        if not response or 'results' not in response:
            logger.warning(f"No results found for query: {query}")
            return []
        
        results = response['results']
        filtered_results = [item for item in results if item['media_type'] in ('movie', 'tv')]
        
        # Сначала сортируем по релевантности (совпадению с запросом)
        sorted_by_relevance = sorted(
            filtered_results,
            key=lambda x: fuzz.ratio(query.lower(), x.get('title', x.get('name', '')).lower()),
            reverse=True
        )
        
        # Берем топ-10 самых релевантных результатов
        top_relevant = sorted_by_relevance[:10]
        
        # Затем сортируем их по популярности
        final_results = sorted(
            top_relevant,
            key=lambda x: float(x.get('popularity', 0)),
            reverse=True
        )
        
        # Остальные результаты добавляем в конец
        remaining_results = sorted_by_relevance[10:]
        final_results.extend(remaining_results)
        
        search_cache[query] = final_results
        return final_results
    
    except Exception as e:
        logger.error(f"Error in TMDb search: {e}")
        return None

async def process_search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.message.text.strip()
    if not query:
        await update.message.reply_text("Пожалуйста, введите название фильма или сериала.")
        return
    
    results = await tmdb_search(query)
    if not results:
        await update.message.reply_text("К сожалению, ничего не найдено. Попробуйте другой запрос.")
        return
    
    context.user_data['results'] = results
    context.user_data['query'] = query
    await send_results_page(update, context, results, 0, query)


async def send_results_page(update: Update, context: ContextTypes.DEFAULT_TYPE, results: List[dict], page: int, query: str) -> None:
    start = page * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    current_page_results = results[start:end]
    total_pages = (len(results) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE
    
    if not current_page_results:
        if update.callback_query:
            await update.callback_query.answer()
            await update.callback_query.edit_message_text("Нет доступных результатов для отображения.")
        else:
            await update.message.reply_text("Нет доступных результатов для отображения.")
        return
    
    page_number = page + 1
    
    # Создаем кнопки для пагинации
    navigation_buttons = []
    if total_pages > 1:
        if page > 0:
            navigation_buttons.append(InlineKeyboardButton("⬅️", callback_data=f"page_{page - 1}"))
        navigation_buttons.append(InlineKeyboardButton(f"{page_number}/{total_pages}", callback_data="current_page"))
        if end < len(results):
            navigation_buttons.append(InlineKeyboardButton("➡️", callback_data=f"page_{page + 1}"))
    
    # Создаем кнопки для результатов (в два столбца)
    result_buttons = []
    for i in range(0, len(current_page_results), 2):
        row = []
        if i < len(current_page_results):
            item1 = current_page_results[i]
            title1 = item1.get('title', item1.get('name', 'Без названия'))
            title1 = (title1[:30] + '...') if len(title1) > 33 else title1
            year1 = item1.get('release_date', item1.get('first_air_date', '')).split('-')[0] or "N/A"
            media_emoji1 = "🎬" if item1['media_type'] == 'movie' else "📺"
            button1 = InlineKeyboardButton(f" {title1} ({year1}) {media_emoji1} ", callback_data=f"details_{item1['id']}_{item1['media_type']}")
            row.append(button1)
        
        if i + 1 < len(current_page_results):
            item2 = current_page_results[i + 1]
            title2 = item2.get('title', item2.get('name', 'Без названия'))
            title2 = (title2[:30] + '...') if len(title2) > 33 else title2
            year2 = item2.get('release_date', item2.get('first_air_date', '')).split('-')[0] or "N/A"
            media_emoji2 = "🎬" if item2['media_type'] == 'movie' else "📺"
            button2 = InlineKeyboardButton(f" {title2} ({year2}) {media_emoji2} ", callback_data=f"details_{item2['id']}_{item2['media_type']}")
            row.append(button2)
        
        result_buttons.append(row)
    
    # Создаем кнопку "В главное меню"
    main_menu_button = [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
    
    # Собираем клавиатуру: сначала кнопка "В главное меню", затем результаты, затем кнопки пагинации
    keyboard = [main_menu_button] + result_buttons + [navigation_buttons]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            f"Результаты поиска для '{query}' (страница {page_number}/{total_pages}):",
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            f"Результаты поиска для '{query}' (страница {page_number}/{total_pages}):",
            reply_markup=reply_markup
        )

async def show_movie_details(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    callback_data = query.data.split('_')
    media_id = callback_data[1]
    media_type = callback_data[2] if len(callback_data) > 2 else 'movie'

    try:
        if media_type == 'movie':
            media = tmdb.Movies(media_id)
            response = await asyncio.to_thread(media.info, language='ru')
            title = escape_html(response.get('title', 'Без названия'))
            year = response.get('release_date', '').split('-')[0] if response.get('release_date') else "N/A"
        else:
            media = tmdb.TV(media_id)
            response = await asyncio.to_thread(media.info, language='ru')
            title = escape_html(response.get('name', 'Без названия'))
            year = response.get('first_air_date', '').split('-')[0] if response.get('first_air_date') else "N/A"

        # Получаем названия стран на русском
        production_countries = response.get('production_countries', [])
        ru_countries = []
        for country in production_countries:
            iso_code = country.get('iso_3166_1')
            if iso_code in ISO_TO_RU:
                ru_countries.append(ISO_TO_RU[iso_code])
            
        countries = ", ".join(ru_countries) if ru_countries else "Неизвестно"
        
        # Форматируем жанры
        genres = format_genres(response.get('genres', []), lang='ru', media_type=media_type)
        rating = f"{response.get('vote_average', 0.0):.1f}"
        overview = escape_html(response.get('overview', 'Нет описания'))

        # Получаем информацию о создателях
        credits_response = await asyncio.to_thread(media.credits)
        directors = []
        
        if media_type == 'tv':
            # Для сериалов проверяем создателей и режиссеров
            creators = response.get('created_by', [])
            for creator in creators:
                if creator.get('name'):
                    name = creator.get('name')
                    if re.search('[а-яА-ЯёЁ]', name):
                        directors.append(escape_html(name))
                    else:
                        translated_name = await translation_service.translate(name)
                        if translation_service.is_valid_translation(name, translated_name):
                            directors.append(escape_html(translated_name))
                        else:
                            directors.append(escape_html(name))
        
        # Добавляем режиссеров для обоих типов
        for crew_member in credits_response.get('crew', []):
            if crew_member.get('job', '').lower() in ['director', 'режиссер']:
                name = crew_member.get('name')
                if name:
                    if re.search('[а-яА-ЯёЁ]', name):
                        directors.append(escape_html(name))
                    else:
                        translated_name = await translation_service.translate(name)
                        if translation_service.is_valid_translation(name, translated_name):
                            directors.append(escape_html(translated_name))
                        else:
                            directors.append(escape_html(name))

        director = ", ".join(set(directors)) if directors else "Неизвестно"
        
        # Получаем актеров
        cast_info = credits_response.get('cast', [])[:5]
        cast = ", ".join([escape_html(await translate_name(actor['name'])) 
                 for actor in cast_info])

        message_text = (
            f"<b>🎬 {title} ({year})</b>\n\n"
            f"🌍 Страна: {countries}\n"
            f"🎭 Жанр: {genres}\n"
            f"⭐ Рейтинг: {rating}\n"
            f"🎥 Режиссер: {director}\n"
            f"👥 В ролях: {cast}\n\n"
            f"📖 {overview[:MAX_DESCRIPTION_LENGTH]}..."
        )

        keyboard = [
    [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
    [InlineKeyboardButton("Читать далее", callback_data=f"expand_{media_id}_{media_type}")],
    [InlineKeyboardButton("⬅️ Назад к списку", callback_data=f"back_to_list_{query.message.message_id}")]
]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(message_text, reply_markup=reply_markup, parse_mode='HTML')

    except Exception as e:
        logger.error(f"Error fetching {media_type} details: {e}")
        await query.edit_message_text("Ошибка получения данных о фильме.")

async def expand_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    try:
        media_id = query.data.split('_')[1]
        media_type = query.data.split('_')[2] if len(query.data.split('_')) > 2 else 'movie'

        # Получаем полную информацию о фильме или сериале
        media = tmdb.TV(media_id) if media_type == 'tv' else tmdb.Movies(media_id)
        response = await asyncio.to_thread(media.info, language='ru')

        if not response:
            raise ValueError("Не удалось получить информацию о медиа")

        # Определяем заголовок и год
        title = escape_html(response.get('name', response.get('title', 'Без названия')))
        date_field = 'first_air_date' if media_type == 'tv' else 'release_date'
        year = response.get(date_field, '').split('-')[0] if response.get(date_field) else "N/A"

        # Безопасное получение создателей/режиссеров
        creators = []
        try:
            credits_response = await asyncio.to_thread(media.credits)
            
            if media_type == 'tv':
                # Список всех возможных должностей режиссеров и создателей
                director_jobs = ['director', 'series director', 'directing', 'television director', 'creator', 'created by']
                
                if credits_response and 'crew' in credits_response:
                    for crew_member in credits_response['crew']:
                        job = crew_member.get('job', '').lower()
                        if job in director_jobs:
                            name = crew_member.get('name', '')
                            if name and isinstance(name, str):
                                translated_name = await translation_service.translate(name)
                                if translated_name and isinstance(translated_name, str) and translated_name != name:
                                    creators.append(escape_html(translated_name))
                                else:
                                    creators.append(escape_html(name))
                
                # Если режиссеров/создателей не нашли в crew, ищем в created_by
                if not creators:
                    for creator in response.get('created_by', []):
                        if creator and isinstance(creator, dict) and creator.get('name'):
                            name = creator.get('name')
                            if isinstance(name, str):
                                translated_name = await translation_service.translate(name)
                                if translated_name and isinstance(translated_name, str) and translated_name != name:
                                    creators.append(escape_html(translated_name))
                                else:
                                    creators.append(escape_html(name))
            else:
                # Для фильмов ищем только режиссеров
                if credits_response and 'crew' in credits_response:
                    for crew_member in credits_response['crew']:
                        if crew_member.get('job', '').lower() == 'director':
                            name = crew_member.get('name', '')
                            if name and isinstance(name, str):
                                translated_name = await translation_service.translate(name)
                                if translated_name and isinstance(translated_name, str) and translated_name != name:
                                    creators.append(escape_html(translated_name))
                                else:
                                    creators.append(escape_html(name))
        except Exception as e:
            logger.error(f"Error getting creators/directors: {e}")
            creators = []

        director = ", ".join(creators) if creators else "Нет информации"

        # Получаем страны производства
        production_countries = response.get('production_countries', [])
        ru_countries = []
        for country in production_countries:
            iso_code = country.get('iso_3166_1')
            if iso_code in ISO_TO_RU:
                ru_countries.append(ISO_TO_RU[iso_code])
            
        countries = ", ".join(ru_countries) if ru_countries else "Нет информации"
        
        # Форматируем жанры
        genres = format_genres(response.get('genres', []), lang='ru', media_type=media_type)
        
        # Получаем рейтинг
        rating = f"{response.get('vote_average', 0.0):.1f}"
        
        # Получаем полное описание
        overview = escape_html(response.get('overview', 'Описание отсутствует'))

        # Получаем актеров
        cast_names = []
        if credits_response and 'cast' in credits_response:
            for actor in credits_response['cast'][:5]:
                if actor.get('name') and isinstance(actor['name'], str):
                    translated_name = await translation_service.translate(actor['name'])
                    if translated_name and isinstance(translated_name, str) and translated_name != actor['name']:
                        cast_names.append(escape_html(translated_name))
                    else:
                        cast_names.append(escape_html(actor['name']))
        
        cast = ", ".join(cast_names) if cast_names else "Нет информации"

        # Формируем текст сообщения
        message_text = (
            f"<b>{'📺' if media_type == 'tv' else '🎬'} {title} ({year})</b>\n\n"
            f"🌍 Страна: {countries}\n"
            f"🎭 Жанр: {genres}\n"
            f"⭐ Рейтинг: {rating}\n"
            f"🎥 Режиссер: {director}\n"
            f"👥 В ролях: {cast}\n\n"
            f"{overview}"
        )

        # Создаем кнопки
        keyboard = [
    [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
    [InlineKeyboardButton("Свернуть описание", callback_data=f"collapse_{media_id}_{media_type}")],
    [InlineKeyboardButton("⬅️ Назад к списку", callback_data="back_to_list")]
]
        reply_markup = InlineKeyboardMarkup(keyboard)

        # Отправляем сообщение
        await query.edit_message_text(message_text, reply_markup=reply_markup, parse_mode='HTML')

    except Exception as e:
        logger.error(f"Ошибка расширения описания {'сериала' if media_type == 'tv' else 'фильма'}: {e}")
        await query.edit_message_text(
            "Произошла ошибка при получении информации. Пожалуйста, попробуйте позже.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")
            ]])
        )

async def collapse_description(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Сворачивает описание фильма или сериала."""
    query = update.callback_query
    await query.answer()

    # Получаем ID и тип медиа из callback_data
    callback_data = query.data.split('_')
    media_id = callback_data[1]
    media_type = callback_data[2] if len(callback_data) > 2 else 'movie'  # По умолчанию фильм

    # Возвращаемся к краткому описанию
    await show_movie_details(update, context)

async def handle_pagination(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    results = context.user_data.get('results')
    search_query = context.user_data.get('query')

    if not results or not search_query:
        await query.edit_message_text("Сессия поиска истекла. Начните новый поиск.")
        return

    total_pages = (len(results) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE

    if query.data == "page_first":
        page = 0
    elif query.data == "page_last":
        page = total_pages - 1
    elif query.data.startswith("page_"):
        page = int(query.data.split('_')[1])
    elif query.data == "back_to_search":
        await query.message.reply_text("Введите название фильма или сериала:")
        context.user_data.clear()
        return
    elif "back_to_list" in query.data:
        page = 0
    else:
        page = 0

    await send_results_page(update, context, results, page, search_query)

async def filter_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Начало процесса фильтрации."""
    context.user_data.clear()  # Очищаем предыдущие данные
    keyboard = [
        [
            InlineKeyboardButton("Фильм", callback_data='type_movie'),
            InlineKeyboardButton("Сериал", callback_data='type_series')
        ],
        [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            'Выберите тип:', 
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            'Выберите тип:', 
            reply_markup=reply_markup
        )
    
    return CHOOSE_TYPE

async def choose_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор типа (фильм/сериал)."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_main_menu":
        return await back_to_main_menu(update, context)
    
    if query.data.startswith("type_"):
        context.user_data['filter_type'] = query.data.split('_')[1]
        
        genre_keyboard = [
            [
                InlineKeyboardButton("Боевик", callback_data="genre_28"),
                InlineKeyboardButton("Комедия", callback_data="genre_35")
            ],
            [
                InlineKeyboardButton("Драма", callback_data="genre_18"),
                InlineKeyboardButton("Фантастика", callback_data="genre_878")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_genre")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_type")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(genre_keyboard)
        await query.edit_message_text("Выберите жанр:", reply_markup=reply_markup)
        return CHOOSE_GENRE
    
    return CHOOSE_TYPE

async def choose_genre(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор жанра."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_type":
        keyboard = [
            [
                InlineKeyboardButton("Фильм", callback_data='type_movie'),
                InlineKeyboardButton("Сериал", callback_data='type_series')
            ],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text('Выберите тип:', reply_markup=reply_markup)
        return CHOOSE_TYPE
    
    if query.data.startswith("genre_") or query.data == "skip_genre":
        if query.data.startswith("genre_"):
            context.user_data['filter_genre'] = query.data.split('_')[1]
        else:
            context.user_data['filter_genre'] = None
        
        keyboard = [
            [
                InlineKeyboardButton("2020-2023", callback_data="year_2020-2023"),
                InlineKeyboardButton("2010-2019", callback_data="year_2010-2019")
            ],
            [
                InlineKeyboardButton("2000-2009", callback_data="year_2000-2009"),
                InlineKeyboardButton("До 2000", callback_data="year_pre2000")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_year")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_genre")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите год выпуска:", reply_markup=reply_markup)
        return CHOOSE_YEAR
    
    return CHOOSE_GENRE

async def choose_year(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор года."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_genre":
        genre_keyboard = [
            [
                InlineKeyboardButton("Боевик", callback_data="genre_28"),
                InlineKeyboardButton("Комедия", callback_data="genre_35")
            ],
            [
                InlineKeyboardButton("Драма", callback_data="genre_18"),
                InlineKeyboardButton("Фантастика", callback_data="genre_878")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_genre")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_type")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(genre_keyboard)
        await query.edit_message_text("Выберите жанр:", reply_markup=reply_markup)
        return CHOOSE_GENRE
    
    if query.data.startswith("year_") or query.data == "skip_year":
        if query.data.startswith("year_"):
            context.user_data['filter_year'] = query.data.split('_')[1]
        else:
            context.user_data['filter_year'] = None
        
        keyboard = [
            [
                InlineKeyboardButton("Более 8", callback_data="rating_high"),
                InlineKeyboardButton("От 5 до 8", callback_data="rating_medium"),
                InlineKeyboardButton("Меньше 5", callback_data="rating_low")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_rating")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_year")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите рейтинг:", reply_markup=reply_markup)
        return CHOOSE_RATING
    
    return CHOOSE_YEAR

async def choose_rating(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор рейтинга."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_year":
        keyboard = [
            [
                InlineKeyboardButton("2020-2023", callback_data="year_2020-2023"),
                InlineKeyboardButton("2010-2019", callback_data="year_2010-2019")
            ],
            [
                InlineKeyboardButton("2000-2009", callback_data="year_2000-2009"),
                InlineKeyboardButton("До 2000", callback_data="year_pre2000")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_year")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_genre")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите год выпуска:", reply_markup=reply_markup)
        return CHOOSE_YEAR
    
    if query.data.startswith("rating_") or query.data == "skip_rating":
        if query.data.startswith("rating_"):
            context.user_data['filter_rating'] = query.data.split('_')[1]
        else:
            context.user_data['filter_rating'] = None
        
        main_countries = [
            'США', 'Россия', 
            'Великобритания', 'Франция',
            'Германия', 'Япония',
            'Южная Корея', 'Китай',
            'Италия', 'Испания',
            'Канада', 'Австралия',
            'Индия', 'Бразилия',
            'Мексика'
        ]
        
        country_buttons = []
        for i in range(0, len(main_countries), 2):
            row = []
            row.append(InlineKeyboardButton(main_countries[i], callback_data=f"country_{main_countries[i]}"))
            
            if i + 1 < len(main_countries):
                row.append(InlineKeyboardButton(main_countries[i+1], callback_data=f"country_{main_countries[i+1]}"))
            
            country_buttons.append(row)
        
        keyboard = country_buttons + [
            [InlineKeyboardButton("Любая", callback_data="skip_country")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_rating")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите страну:", reply_markup=reply_markup)
        return CHOOSE_COUNTRY
    
    return CHOOSE_RATING

async def choose_country(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор страны."""
    query = update.callback_query
    await query.answer()
    
    if query.data == "back_to_rating":
        keyboard = [
            [
                InlineKeyboardButton("Более 8", callback_data="rating_high"),
                InlineKeyboardButton("От 5 до 8", callback_data="rating_medium"),
                InlineKeyboardButton("Меньше 5", callback_data="rating_low")
            ],
            [InlineKeyboardButton("Любой", callback_data="skip_rating")],
            [InlineKeyboardButton("« Назад", callback_data="back_to_year")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите рейтинг:", reply_markup=reply_markup)
        return CHOOSE_RATING
    
    if query.data.startswith("country_") or query.data == "skip_country":
        if query.data.startswith("country_"):
            context.user_data['filter_country'] = query.data.split('_')[1]
        else:
            context.user_data['filter_country'] = None
        
        await perform_filtered_search(update, context)
        return ConversationHandler.END
    
    return CHOOSE_COUNTRY

async def perform_filtered_search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.info("Начало выполнения perform_filtered_search")
    query = update.callback_query
    await query.answer()

    # Извлечение параметров фильтрации
    filter_type = context.user_data.get('filter_type', 'movie')
    filter_genre = context.user_data.get('filter_genre')
    filter_year = context.user_data.get('filter_year')
    filter_rating = context.user_data.get('filter_rating')
    filter_country = context.user_data.get('filter_country')
    sort_by = context.user_data.get('sort_by', 'popularity.desc')

    current_date = datetime.now().strftime('%Y-%m-%d')
    current_year = datetime.now().year

    logger.info(f"Текущие параметры фильтрации:")
    logger.info(f"Тип: {filter_type}")
    logger.info(f"Жанр: {filter_genre}")
    logger.info(f"Год: {filter_year}")
    logger.info(f"Рейтинг: {filter_rating}")
    logger.info(f"Страна: {filter_country}")
    logger.info(f"Сортировка: {sort_by}")
    logger.info(f"Текущая дата: {current_date}")

    # Параметры для поиска
    params = {
        'language': 'ru',
        'sort_by': sort_by,
        'include_adult': False,
        'with_origin_country': RU_COUNTRIES.get(filter_country, filter_country)
    }

    # Обработка жанров
    if filter_genre:
        genre_id = filter_genre
        if filter_type == 'series':
            genre_id = '10759' if genre_id == '28' else genre_id
        params['with_genres'] = genre_id

    # Обработка года
    year_ranges = {
        '2020-2023': {'start': 2020, 'end': current_year},
        '2010-2019': {'start': 2010, 'end': 2019},
        '2000-2009': {'start': 2000, 'end': 2009},
        'pre2000': {'start': 1900, 'end': 1999}
    }

    if filter_year and filter_year != 'skip_year':
        year_range = year_ranges.get(filter_year, {})
        
        # Для фильмов
        if filter_type in ['movie', 'all']:
            params['release_date.gte'] = f'{year_range["start"]}-01-01'
            params['release_date.lte'] = f'{year_range["end"]}-12-31'
        
        # Для сериалов
        if filter_type in ['series', 'all']:
            params['first_air_date.gte'] = f'{year_range["start"]}-01-01'
            params['first_air_date.lte'] = f'{year_range["end"]}-12-31'

    # Обработка рейтинга 
    if filter_rating and filter_rating != 'skip_rating':
        rating_ranges = {
            'high': {'gte': 8.0},
            'medium': {'gte': 5.0, 'lte': 8.0},
            'low': {'lte': 5.0}
        }
        rating_range = rating_ranges.get(filter_rating, {})
        
        params['vote_average.gte'] = rating_range.get('gte', 0)
        if 'lte' in rating_range:
            params['vote_average.lte'] = rating_range['lte']

    try:
        results = []
        
        # Универсальный поиск для всех типов
        if filter_type == 'all':
            movie_params = params.copy()
            tv_params = params.copy()
            
            movie_response = await asyncio.to_thread(tmdb.Discover().movie, **movie_params)
            tv_response = await asyncio.to_thread(tmdb.Discover().tv, **tv_params)
            
            # Объединяем результаты с типом медиа
            movie_results = movie_response.get('results', [])
            tv_results = tv_response.get('results', [])
            
            for movie in movie_results:
                movie['media_type'] = 'movie'
            for tv in tv_results:
                tv['media_type'] = 'tv'
            
            results = movie_results + tv_results
        else:
            # Поиск для конкретного типа
            search_function = tmdb.Discover().tv if filter_type == 'series' else tmdb.Discover().movie
            media_type = 'tv' if filter_type == 'series' else 'movie'
            
            response = await asyncio.to_thread(search_function, **params)
            results = response.get('results', [])
            for item in results:
                item['media_type'] = media_type

        logger.info(f"Всего элементов до фильтрации: {len(results)}")

        # Фильтрация результатов
        filtered_results = []
        for item in results:
            release_date = item.get('release_date', item.get('first_air_date', ''))
            title = item.get('title', item.get('name', 'Неизвестно'))
            
            logger.info(f"Обработка элемента: {title}, дата выхода: {release_date}")

            # Пропускаем элементы с пустой датой
            if not release_date:
                logger.info(f"Пропуск {title}: пустая дата выхода")
                continue

            # Пропускаем элементы с будущей датой
            try:
                # Преобразуем дату в строку и берем первые 10 символов
                release_date_str = str(release_date)[:10]
                
                if release_date_str > current_date:
                    logger.info(f"Пропуск {title}: дата выхода в будущем {release_date_str}")
                    continue
            except Exception as e:
                logger.error(f"Ошибка обработки даты для {title}: {e}")
                continue

            # Проверка года, если фильтр года установлен
            if filter_year != 'skip_year':
                try:
                    # Безопасное извлечение года
                    year_str = str(release_date)[:4]
                    year = int(year_str) if year_str.isdigit() else 0
                    
                    range_start, range_end = year_ranges.get(filter_year, (1900, current_year))
                    
                    if year < range_start or year > range_end:
                        logger.info(f"Пропуск {title}: год {year} вне диапазона {range_start}-{range_end}")
                        continue
                except (ValueError, TypeError) as e:
                    logger.error(f"Ошибка обработки года для {title}: {e}")
                    continue
            
            filtered_results.append(item)

        logger.info(f"Найдено элементов после фильтрации: {len(filtered_results)}")

        # Сортировка результатов
        if sort_by == 'popularity.desc':
            filtered_results.sort(key=lambda x: float(x.get('popularity', 0)), reverse=True)
        elif sort_by == 'vote_average.desc':
            filtered_results.sort(key=lambda x: float(x.get('vote_average', 0)), reverse=True)
        elif sort_by == 'primary_release_date.desc':
            filtered_results.sort(
                key=lambda x: x.get('release_date', x.get('first_air_date', '1900-01-01')), 
                reverse=True
            )

        if not filtered_results:
            message = (
                "❌ По вашему запросу ничего не найдено.\n\n"
                "Возможные причины:\n"
                "• Слишком узкие критерии поиска\n"
                "• Нет контента с этими параметрами\n"
                "• Технические ограничения API\n\n"
                "Попробуйте изменить параметры поиска."
            )
            keyboard = [
                [InlineKeyboardButton("🔄 Новый поиск", callback_data="search_by_filter")],
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(message, reply_markup=reply_markup)
            return

        # Создание информации о фильтрах
        filter_info = []
        if filter_type != 'all':
            filter_info.append(f"Тип: {'Сериал' if filter_type == 'series' else 'Фильм'}")
        if filter_genre:
            genre_name = get_genre_name(filter_genre, media_type=filter_type)
            filter_info.append(f"Жанр: {genre_name}")
        if filter_year:
            year_text = {
                '2020-2023': '2020-2023',
                '2010-2019': '2010-2019',
                '2000-2009': '2000-2009',
                'pre2000': 'До 2000'
            }.get(filter_year)
            if year_text:
                filter_info.append(f"Год: {year_text}")
        if filter_rating:
            rating_text = {
                'high': 'Более 8',
                'medium': 'От 5 до 8',
                'low': 'Меньше 5'
            }.get(filter_rating)
            if rating_text:
                filter_info.append(f"Рейтинг: {rating_text}")
        if filter_country:
            filter_info.append(f"Страна: {filter_country}")
        
        sort_text = {
            'popularity.desc': 'по популярности',
            'vote_average.desc': 'по рейтингу',
            'primary_release_date.desc': 'по дате выхода'
        }.get(sort_by, 'по популярности')
        filter_info.append(f"Сортировка: {sort_text}")

        filter_summary = " | ".join(filter_info)
        search_query = f"Результаты поиска\n📋 Фильтры: {filter_summary}"

        context.user_data['results'] = filtered_results
        context.user_data['query'] = search_query

        await send_results_page(update, context, filtered_results, 0, search_query)

    except Exception as e:
        logger.error(f"Критическая ошибка при поиске: {e}")
        error_message = (
            "❌ Произошла ошибка при поиске.\n\n"
            "Попробуйте повторить поиск или измените параметры."
        )
        keyboard = [
            [InlineKeyboardButton("🔄 Новый поиск", callback_data="search_by_filter")],
            [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(error_message, reply_markup=reply_markup)

async def cancel_filter(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    if query:
        await query.answer()
        await query.edit_message_text('Поиск отменён.')
    return ConversationHandler.END


def main() -> None:
    logger.info("Bot started")
    application = Application.builder().token(BOT_TOKEN).build()

    # Основные команды
    application.add_handler(CommandHandler("start", start))
    
    # Обработчик кнопки "В главное меню" должен быть первым
    application.add_handler(CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$"))
    
    # ConversationHandler для фильтров
    # Состояния для ConversationHandler (без изменений)
CHOOSE_TYPE, CHOOSE_GENRE, CHOOSE_YEAR, CHOOSE_RATING, CHOOSE_COUNTRY, SHOW_RESULTS = range(6)

async def filter_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Начало процесса фильтрации."""
    context.user_data.clear()  # Очищаем предыдущие данные
    keyboard = [
        [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
        [
            InlineKeyboardButton("🎬 Фильм", callback_data='type_movie'),
            InlineKeyboardButton("📺 Сериал", callback_data='type_series')
        ],
        [InlineKeyboardButton("🎬📺 Все", callback_data='type_all')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if update.callback_query:
        await update.callback_query.answer()
        await update.callback_query.edit_message_text(
            'Выберите тип:', 
            reply_markup=reply_markup
        )
    else:
        await update.message.reply_text(
            'Выберите тип:', 
            reply_markup=reply_markup
        )
    
    return CHOOSE_TYPE

async def choose_type(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose type called with data: {query.data}")
    
    try:
        if query.data == "back_to_main_menu":
            logger.info("Returning to main menu from type selection")
            return await back_to_main_menu(update, context)
        
        if query.data == "back_to_type":
            logger.info("Returning to type selection")
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("🎬 Фильм", callback_data='type_movie'),
                    InlineKeyboardButton("📺 Сериал", callback_data='type_series')
                ],
                [InlineKeyboardButton("🎬📺 Все", callback_data='type_all')],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_type")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Выберите тип:', reply_markup=reply_markup)
            return CHOOSE_TYPE
        
        if query.data.startswith("type_"):
            context.user_data['filter_type'] = query.data.split('_')[1]
            logger.info(f"Selected type: {context.user_data['filter_type']}")
            
            genre_keyboard = [
    [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
    [
        InlineKeyboardButton("Боевик", callback_data="genre_28"),
        InlineKeyboardButton("Комедия", callback_data="genre_35")
    ],
    [
        InlineKeyboardButton("Драма", callback_data="genre_18"),
        InlineKeyboardButton("Фантастика", callback_data="genre_878")
    ],
    [InlineKeyboardButton("Любой", callback_data="skip_genre")],
    [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_type")]
]
            reply_markup = InlineKeyboardMarkup(genre_keyboard)
            await query.edit_message_text("Выберите жанр:", reply_markup=reply_markup)
            return CHOOSE_GENRE
        
        logger.warning(f"Unhandled type selection: {query.data}")
        return CHOOSE_TYPE
    
    except Exception as e:
        logger.error(f"Error in choose_type: {e}")
        return CHOOSE_TYPE

async def choose_genre(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор жанра."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose genre called with data: {query.data}")
    
    try:
        if query.data == "back_to_type":
            logger.info("Returning to type selection from genre")
            keyboard = [
                [
                    InlineKeyboardButton("Фильм", callback_data='type_movie'),
                    InlineKeyboardButton("Сериал", callback_data='type_series')
                ],
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text('Выберите тип:', reply_markup=reply_markup)
            return CHOOSE_TYPE
        
        if query.data == "back_to_genre":
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("Боевик", callback_data="genre_28"),
                    InlineKeyboardButton("Комедия", callback_data="genre_35")
                ],
                [
                    InlineKeyboardButton("Драма", callback_data="genre_18"),
                    InlineKeyboardButton("Фантастика", callback_data="genre_878")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_genre")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_type")],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите жанр:", reply_markup=reply_markup)
            return CHOOSE_GENRE
        
        if query.data.startswith("genre_") or query.data == "skip_genre":
            if query.data.startswith("genre_"):
                context.user_data['filter_genre'] = query.data.split('_')[1]
                logger.info(f"Selected genre: {context.user_data['filter_genre']}")
            else:
                context.user_data['filter_genre'] = None
                logger.info("Genre skipped")
            
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("2020-2023", callback_data="year_2020-2023"),
                    InlineKeyboardButton("2010-2019", callback_data="year_2010-2019")
                ],
                [
                    InlineKeyboardButton("2000-2009", callback_data="year_2000-2009"),
                    InlineKeyboardButton("До 2000", callback_data="year_pre2000")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_year")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_genre")],              
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите год выпуска:", reply_markup=reply_markup)
            return CHOOSE_YEAR
        
        logger.warning(f"Unhandled genre selection: {query.data}")
        return CHOOSE_GENRE
    
    except Exception as e:
        logger.error(f"Error in choose_genre: {e}")
        return CHOOSE_GENRE

async def choose_year(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор года."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose year called with data: {query.data}")
    
    try:
        if query.data == "back_to_genre":
            logger.info("Returning to genre selection from year")
            genre_keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("Боевик", callback_data="genre_28"),
                    InlineKeyboardButton("Комедия", callback_data="genre_35")
                ],
                [
                    InlineKeyboardButton("Драма", callback_data="genre_18"),
                    InlineKeyboardButton("Фантастика", callback_data="genre_878")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_genre")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_type")]
            ]
            reply_markup = InlineKeyboardMarkup(genre_keyboard)
            await query.edit_message_text("Выберите жанр:", reply_markup=reply_markup)
            return CHOOSE_GENRE
        
        if query.data == "back_to_year":
            keyboard = [
    [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
    [
        InlineKeyboardButton("2020-2023", callback_data="year_2020-2023"),
        InlineKeyboardButton("2010-2019", callback_data="year_2010-2019")
    ],
    [
        InlineKeyboardButton("2000-2009", callback_data="year_2000-2009"),
        InlineKeyboardButton("До 2000", callback_data="year_pre2000")
    ],
    [InlineKeyboardButton("Любой", callback_data="skip_year")],
    [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_genre")]
]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите год выпуска:", reply_markup=reply_markup)
            return CHOOSE_YEAR
        
        if query.data.startswith("year_") or query.data == "skip_year":
            if query.data.startswith("year_"):
                context.user_data['filter_year'] = query.data.split('_')[1]
                logger.info(f"Selected year: {context.user_data['filter_year']}")
            else:
                context.user_data['filter_year'] = None
                logger.info("Year skipped")
            
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("Более 8", callback_data="rating_high"),
                    InlineKeyboardButton("От 5 до 8", callback_data="rating_medium"),
                    InlineKeyboardButton("Меньше 5", callback_data="rating_low")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_rating")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_year")],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите рейтинг:", reply_markup=reply_markup)
            return CHOOSE_RATING
        
        logger.warning(f"Unhandled year selection: {query.data}")
        return CHOOSE_YEAR
    
    except Exception as e:
        logger.error(f"Error in choose_year: {e}")
        return CHOOSE_YEAR

async def choose_rating(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор рейтинга."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose rating called with data: {query.data}")
    
    try:
        if query.data == "back_to_year":
            logger.info("Returning to year selection from rating")
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("2020-2023", callback_data="year_2020-2023"),
                    InlineKeyboardButton("2010-2019", callback_data="year_2010-2019")
                ],
                [
                    InlineKeyboardButton("2000-2009", callback_data="year_2000-2009"),
                    InlineKeyboardButton("До 2000", callback_data="year_pre2000")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_year")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_genre")],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите год выпуска:", reply_markup=reply_markup)
            return CHOOSE_YEAR
        
        if query.data == "back_to_rating":
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("Более 8", callback_data="rating_high"),
                    InlineKeyboardButton("От 5 до 8", callback_data="rating_medium"),
                    InlineKeyboardButton("Меньше 5", callback_data="rating_low")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_rating")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_year")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите рейтинг:", reply_markup=reply_markup)
            return CHOOSE_RATING
        
        if query.data.startswith("rating_") or query.data == "skip_rating":
            if query.data.startswith("rating_"):
                context.user_data['filter_rating'] = query.data.split('_')[1]
                logger.info(f"Selected rating: {context.user_data['filter_rating']}")
            else:
                context.user_data['filter_rating'] = None
                logger.info("Rating skipped")
            
            main_countries = [
                'США', 'Россия', 
                'Великобритания', 'Франция',
                'Германия', 'Япония',
                'Южная Корея', 'Китай',
                'Италия', 'Испания',
                'Канада', 'Австралия',
                'Индия', 'Бразилия'
            ]
            
            country_buttons = []
            for i in range(0, len(main_countries), 2):
                row = []
                row.append(InlineKeyboardButton(main_countries[i], callback_data=f"country_{main_countries[i]}"))
                
                if i + 1 < len(main_countries):
                    row.append(InlineKeyboardButton(main_countries[i+1], callback_data=f"country_{main_countries[i+1]}"))
                
                country_buttons.append(row)
            
            # Сначала кнопка "В главное меню", затем страны и навигационные кнопки
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
            ] + country_buttons + [
                [InlineKeyboardButton("Любая", callback_data="skip_country")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_rating")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите страну:", reply_markup=reply_markup)
            return CHOOSE_COUNTRY
        
        logger.warning(f"Unhandled rating selection: {query.data}")
        return CHOOSE_RATING
    
    except Exception as e:
        logger.error(f"Error in choose_rating: {e}")
        return CHOOSE_RATING

async def choose_country(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор страны."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose country called with data: {query.data}")
    
    try:
        if query.data == "back_to_rating":
            logger.info("Returning to rating selection from country")
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [
                    InlineKeyboardButton("Более 8", callback_data="rating_high"),
                    InlineKeyboardButton("От 5 до 8", callback_data="rating_medium"),
                    InlineKeyboardButton("Меньше 5", callback_data="rating_low")
                ],
                [InlineKeyboardButton("Любой", callback_data="skip_rating")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_year")],
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите рейтинг:", reply_markup=reply_markup)
            return CHOOSE_RATING
        
        if query.data == "back_to_country":
            main_countries = [
                'США', 'Россия', 
                'Великобритания', 'Франция',
                'Германия', 'Япония',
                'Южная Корея', 'Китай',
                'Италия', 'Испания',
                'Канада', 'Австралия',
                'Индия', 'Бразилия',
                'Мексика'
            ]
            
            country_buttons = []
            for i in range(0, len(main_countries), 2):
                row = []
                row.append(InlineKeyboardButton(main_countries[i], callback_data=f"country_{main_countries[i]}"))
                if i + 1 < len(main_countries):
                    row.append(InlineKeyboardButton(main_countries[i+1], callback_data=f"country_{main_countries[i+1]}"))
                country_buttons.append(row)

            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
            ] + country_buttons + [
                [InlineKeyboardButton("Любая", callback_data="skip_country")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_rating")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите страну:", reply_markup=reply_markup)
            return CHOOSE_COUNTRY
        
        if query.data.startswith("country_") or query.data == "skip_country":
            if query.data.startswith("country_"):
                context.user_data['filter_country'] = query.data.split('_')[1]
                logger.info(f"Selected country: {context.user_data['filter_country']}")
            else:
                context.user_data['filter_country'] = None
                logger.info("Country skipped")
            
            # Показываем опции сортировки
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")],
                [InlineKeyboardButton("По популярности ⭐", callback_data="sort_popularity")],
                [InlineKeyboardButton("По рейтингу 📊", callback_data="sort_rating")],
                [InlineKeyboardButton("По дате выхода 📅", callback_data="sort_date")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_country")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите способ сортировки:", reply_markup=reply_markup)
            return CHOOSE_SORT
        
        logger.warning(f"Unhandled country selection: {query.data}")
        return CHOOSE_COUNTRY
    
    except Exception as e:
        logger.error(f"Error in choose_country: {e}")
        return CHOOSE_COUNTRY
    
async def choose_sort(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Выбор способа сортировки."""
    query = update.callback_query
    await query.answer()
    
    logger.info(f"Choose sort called with data: {query.data}")
    
    try:
        if query.data == "back_to_country":
            main_countries = [
                'США', 'Россия', 
                'Великобритания', 'Франция',
                'Германия', 'Япония',
                'Южная Корея', 'Китай',
                'Италия', 'Испания',
                'Канада', 'Австралия',
                'Индия', 'Бразилия'
            ]
            
            country_buttons = []
            for i in range(0, len(main_countries), 2):
                row = []
                row.append(InlineKeyboardButton(main_countries[i], callback_data=f"country_{main_countries[i]}"))
                if i + 1 < len(main_countries):
                    row.append(InlineKeyboardButton(main_countries[i+1], callback_data=f"country_{main_countries[i+1]}"))
                country_buttons.append(row)
            
            keyboard = [
                [InlineKeyboardButton("🏠 В главное меню", callback_data="back_to_main_menu")]
            ] + country_buttons + [
                [InlineKeyboardButton("Любая", callback_data="skip_country")],
                [InlineKeyboardButton("⬅️ Назад", callback_data="back_to_rating")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text("Выберите страну:", reply_markup=reply_markup)
            return CHOOSE_COUNTRY
        
        if query.data.startswith("sort_"):
            sort_type = query.data.split('_')[1]
            sort_params = {
                'popularity': 'popularity.desc',
                'rating': 'vote_average.desc',
                'date': 'primary_release_date.desc'
            }
            context.user_data['sort_by'] = sort_params.get(sort_type)
            logger.info(f"Selected sort type: {sort_type} -> {context.user_data['sort_by']}")
            
            await perform_filtered_search(update, context)
            return ConversationHandler.END
        
        logger.warning(f"Unhandled sort selection: {query.data}")
        return CHOOSE_SORT
    
    except Exception as e:
        logger.error(f"Error in choose_sort: {e}")
        return CHOOSE_SORT

# В функции main() обновите ConversationHandler:
def main() -> None:
    logger.info("Bot started")
    application = Application.builder().token(BOT_TOKEN).build()

    application.add_handler(CommandHandler("start", start))
    
    # Обработчик кнопки "В главное меню" должен быть первым
    application.add_handler(CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$"))
    
    # Добавьте этот обработчик явно
    application.add_handler(CallbackQueryHandler(handle_main_menu_selection, pattern="^search_by_filter$"))
    
    # ConversationHandler для фильтров
    conv_handler = ConversationHandler(
        entry_points=[
            CommandHandler("filter", filter_command),
            CallbackQueryHandler(choose_type, pattern="^search_by_filter$"),
            CallbackQueryHandler(choose_type, pattern="^type_")
        ],
        states={
            CHOOSE_TYPE: [
                CallbackQueryHandler(choose_type, pattern="^type_"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$"),
                CallbackQueryHandler(handle_main_menu_selection, pattern="^back_to_type$")
            ],
            CHOOSE_GENRE: [
                CallbackQueryHandler(choose_genre, pattern="^genre_"),
                CallbackQueryHandler(choose_genre, pattern="^skip_genre$"),
                CallbackQueryHandler(choose_type, pattern="^back_to_type$"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
            ],
            CHOOSE_YEAR: [
                CallbackQueryHandler(choose_year, pattern="^year_"),
                CallbackQueryHandler(choose_year, pattern="^skip_year$"),
                CallbackQueryHandler(choose_genre, pattern="^back_to_genre$"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
            ],
            CHOOSE_RATING: [
                CallbackQueryHandler(choose_rating, pattern="^rating_"),
                CallbackQueryHandler(choose_rating, pattern="^skip_rating$"),
                CallbackQueryHandler(choose_year, pattern="^back_to_year$"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
            ],
            CHOOSE_COUNTRY: [
                CallbackQueryHandler(choose_country, pattern="^country_"),
                CallbackQueryHandler(choose_country, pattern="^skip_country$"),
                CallbackQueryHandler(choose_rating, pattern="^back_to_rating$"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
            ],
            CHOOSE_SORT: [
                CallbackQueryHandler(choose_sort, pattern="^sort_"),
                CallbackQueryHandler(choose_country, pattern="^back_to_country$"),
                CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
            ]
        },
        fallbacks=[
            CallbackQueryHandler(back_to_main_menu, pattern="^back_to_main_menu$")
        ],
        allow_reentry=True
    )
    
    application.add_handler(conv_handler)
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, process_search))
    application.add_handler(CallbackQueryHandler(show_movie_details, pattern="^details_"))
    application.add_handler(CallbackQueryHandler(expand_description, pattern="^expand_"))
    application.add_handler(CallbackQueryHandler(collapse_description, pattern="^collapse_"))
    application.add_handler(CallbackQueryHandler(handle_pagination, pattern="^page_|^back_to_list"))
    application.add_handler(CallbackQueryHandler(handle_main_menu_selection, pattern="^search_by_title$"))

    application.run_polling()

if __name__ == "__main__":
    main()
