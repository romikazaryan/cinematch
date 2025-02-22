from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, CallbackQuery
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
import logging
import os
import asyncio
from dotenv import load_dotenv
import tmdbsimple as tmdb

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

async def search_movies(query: str) -> list:
    """Поиск фильмов и сериалов"""
    try:
        search = tmdb.Search()
        response = await asyncio.to_thread(search.multi, query=query, language='ru')
        
        if not response or 'results' not in response:
            return []
        
        # Фильтруем только фильмы и сериалы
        results = [
            item for item in response.get('results', [])
            if item.get('media_type') in ('movie', 'tv')
        ]
        
        # Сортируем по популярности
        results.sort(key=lambda x: float(x.get('popularity', 0)), reverse=True)
        
        return results[:10]  # Возвращаем топ-10 результатов
    except Exception as e:
        logger.error(f"Error searching movies: {e}")
        return []

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик текстовых сообщений"""
    query = update.message.text.strip()
    logger.info(f'Received text: {query}')
    
    results = await search_movies(query)
    
    if not results:
        await update.message.reply_text(
            "К сожалению, ничего не найдено. Попробуйте другой запрос или используйте поиск по фильтрам.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("« В главное меню", callback_data='back_to_main')
            ]])
        )
        return
    
    # Создаем клавиатуру с результатами
    keyboard = []
    for item in results:
        title = item.get('title', item.get('name', 'Без названия'))
        year = item.get('release_date', item.get('first_air_date', ''))[:4]
        media_type = '🎬' if item['media_type'] == 'movie' else '📺'
        
        keyboard.append([InlineKeyboardButton(
            f"{media_type} {title} ({year})",
            callback_data=f"details_{item['id']}_{item['media_type']}"
        )])
    
    keyboard.append([InlineKeyboardButton("« В главное меню", callback_data='back_to_main')])
    
    await update.message.reply_text(
        f"Найдено результатов: {len(results)}",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик команды /start"""
    logger.info('User triggered /start command')
    
    keyboard = [
        [
            InlineKeyboardButton("🔍 Поиск по названию", callback_data='search_by_name'),
            InlineKeyboardButton("🎯 Поиск по фильтрам", callback_data='search_by_filter')
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    text = "Привет! Я помогу найти фильмы и сериалы. Выберите способ поиска:"
    
    await update.message.reply_text(text, reply_markup=reply_markup)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик нажатий на кнопки"""
    query = update.callback_query
    await query.answer()  # Обязательно отвечаем на callback
    
    logger.info(f'Button pressed: {query.data}')
    
    if query.data == 'search_by_name':
        await query.edit_message_text(
            text="Введите название фильма или сериала:",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("« Назад", callback_data='back_to_main')
            ]])
        )
    
    elif query.data == 'search_by_filter':
        keyboard = [
            [
                InlineKeyboardButton("🎬 Фильмы", callback_data='filter_movies'),
                InlineKeyboardButton("📺 Сериалы", callback_data='filter_series')
            ],
            [InlineKeyboardButton("« Назад", callback_data='back_to_main')]
        ]
        await query.edit_message_text(
            text="Выберите тип:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    
    elif query.data == 'back_to_main':
        keyboard = [
            [
                InlineKeyboardButton("🔍 Поиск по названию", callback_data='search_by_name'),
                InlineKeyboardButton("🎯 Поиск по фильтрам", callback_data='search_by_filter')
            ]
        ]
        await query.edit_message_text(
            text="Выберите способ поиска:",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )

async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработчик текстовых сообщений"""
    logger.info(f'Received text: {update.message.text}')
    await update.message.reply_text(
        text="Получил ваше сообщение! Пока я могу только показывать меню. Используйте /start",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("« В главное меню", callback_data='back_to_main')
        ]])
    )

def main() -> None:
    """Запуск бота"""
    load_dotenv()
    token = os.getenv("BOT_TOKEN")
    tmdb.API_KEY = os.getenv("TMDB_API_KEY")
    
    if not token or not tmdb.API_KEY:
        logger.error("Не найдены необходимые переменные окружения")
        return
    
    application = Application.builder().token(token).build()
    
    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_callback))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    
    # Запускаем бота
    logger.info("Bot started")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
