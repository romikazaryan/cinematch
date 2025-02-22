# test_mongo.py
from pymongo import MongoClient

try:
    # Подключение к MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    
    # Проверка соединения
    client.admin.command('ping')
    print("Успешное подключение к MongoDB!")
    
    # Получение списка баз данных
    dbs = client.list_database_names()
    print("Доступные базы данных:", dbs)
    
    # Работа с нашей базой
    db = client.movie_bot
    cache = db.cache
    
    # Тестовая запись
    test_doc = {"test": "connection"}
    result = cache.insert_one(test_doc)
    print("Документ добавлен:", result.inserted_id)
    
    # Проверка чтения
    found = cache.find_one({"test": "connection"})
    print("Найденный документ:", found)

except Exception as e:
    print("Ошибка при подключении к MongoDB:", e)
