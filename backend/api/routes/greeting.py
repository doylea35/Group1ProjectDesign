from fastapi import APIRouter
from typing import Dict

greeting_router = APIRouter()

@greeting_router.get("/")
def hello() -> Dict[str, str]:
    return {"message": "Hello from GroupGrade server"}