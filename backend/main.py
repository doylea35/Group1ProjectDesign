from fastapi import FastAPI
from api.greeting import greeting_router
from api.profiles import profiles_router
from db.db_utils import connect_to_mongodb
from db.models import User, Group, Task


app = FastAPI()

# connect to MongoDB client
db_client = connect_to_mongodb()

# routers
app.include_router(greeting_router, prefix="", tags=["greeting"])
app.include_router(profiles_router, prefix="", tags=["profiles"])