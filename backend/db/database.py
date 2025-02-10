import os
from db.db_utils import connect_to_mongodb
from pymongo import MongoClient
from dotenv import load_dotenv

# connect to MongoDB client
client = connect_to_mongodb()
db = client.GroupGrade

# MongoDB Collections
users_collection = db["users"] #db["users"] # tb podem fer db["users"] ?
groups_collection = db["groups"]
tasks_collection = db["tasks"]