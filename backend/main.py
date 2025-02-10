from fastapi import FastAPI
from api.greeting import greeting_router
from api.profiles import profiles_router
from db.models import User, Group, Task


app = FastAPI()


# routers
app.include_router(greeting_router, prefix="", tags=["greeting"])
app.include_router(profiles_router, prefix="", tags=["profiles"])