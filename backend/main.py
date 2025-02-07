from fastapi import FastAPI
from api.greeting import greeting_router
from db.db_utils import connect_to_mongodb


app = FastAPI()

# connect to MongoDB client
db_client = connect_to_mongodb()

app.include_router(greeting_router, prefix="", tags=["greeting"])