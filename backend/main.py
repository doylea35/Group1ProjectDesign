from fastapi import FastAPI
from typing import Dict
from api.greeting import greeting_router

app = FastAPI()

app.include_router(greeting_router, prefix="", tags=["greeting"])