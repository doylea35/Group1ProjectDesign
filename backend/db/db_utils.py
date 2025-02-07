import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL : str = os.getenv("MONGODB_URL")

def connect_to_mongodb() -> MongoClient:
    try:
        client : MongoClient = MongoClient(MONGODB_URL)
        print(f"MongoDB Connected: {client.HOST}:{client.PORT}")
        return client
    except Exception as e:
        print(f"Error occured when attempting to connect to MongoDB server.\nError: {e}")
        exit(1)