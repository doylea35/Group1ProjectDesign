from db.db_utils import connect_to_mongodb
from pymongo import MongoClient
from pymongo.database import Database, Collection


# connect to MongoDB client
client : MongoClient = connect_to_mongodb()
db : Database = client.GroupGrade

# MongoDB Collections
users_collection : Collection = db["users"] #db["users"] # tb podem fer db["users"] ?
groups_collection : Collection = db["groups"]
tasks_collection : Collection = db["tasks"]