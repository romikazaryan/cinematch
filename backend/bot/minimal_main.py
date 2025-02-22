from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes, MessageHandler, filters
import logging
import sys
from dotenv import load_dotenv
import os

# Расширенное логирование
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG,
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.info(f"Received start command from user {update.effective_user.id}")
    keyboard = [
        [InlineKeyboardButton("Поиск по названию", callback_data='search_by_title')],
        [InlineKeyboardButton("Поиск по фильтру", callback_data='search_by_filter')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    text = ("Добро пожаловать! Вы можете искать фильмы и сериалы двумя способами:\n"
           "1. Просто введите название фильма или сериала.\n"
           "2. Используйте команду /filter для поиска по параметрам.")
    
    if update.message:
        await update.message.reply_text(text, reply_markup=reply_markup)
    elif update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=reply_markup)

async def handle_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    logger.info(f"Button pressed: {query.data}")
    await query.edit_message_text(f"Вы выбрали: {query.data}")

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.info(f"Received message: {update.message.text}")
    await update.message.reply_text(f"Вы написали: {update.message.text}")

def main() -> None:
    load_dotenv()
    token = os.getenv("BOT_TOKEN")
    if not token:
        logger.error("BOT_TOKEN not found in environment variables")
        return

    logger.info("Starting bot...")
    application = Application.builder().token(token).build()

    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(handle_button))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    logger.info("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
