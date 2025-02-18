from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from db.models import FreeTimeSlot
from db.database import users_collection
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from api.utils import is_valid_email

# Load API Key from environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

calendar_router = APIRouter()

# Define a request model
class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 10000


@calendar_router.get("/getAllFreeTime/{user_email}")
async def get_all_freetime_for_user(user_email : str):
    if not is_valid_email(user_email):
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email: {user_email} is not a valid email"
            )
    user = users_collection.find_one({"email": user_email})
    
    if not user:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email: {user_email}' does not exist."
            )
    
    return {"message": "Here are the free time slot", "data":user["free_time"]}
    
@calendar_router.put("/updateFreeTime/{user_email}")
async def update_free_time(user_email: str, updated_free_time: Dict[str, List[FreeTimeSlot]]):

    if not is_valid_email(user_email):
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email: {user_email} is not a valid email"
            )

    # Validate input
    if not isinstance(updated_free_time, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid free time format. Expected a dictionary."
        )
    
    update_data = {
        "free_time": {
            day: [{"start": slot.start, "end": slot.end} for slot in slots]
            for day, slots in updated_free_time.items()
        }
    }
    
    update_query = {"$set": {"free_time": update_data}}
    
    updated_user = users_collection.find_one_and_update(
        {"email": user_email}, 
        update_query, 
        return_document=True)

    if not updated_user:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Free time slots update failed. Please try again."
            )
    updated_user["_id"] = str(updated_user["_id"])
    return {"message": "Free time updated successfully", "data": updated_user}





@calendar_router.post("/getFreeTime")
async def ask_chatgpt_for_free_time(request: ChatRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": request.prompt}],
            max_tokens=request.max_tokens
        )
        return {"response": response["choices"][0]["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR , detail=str(e))
    
# message = ChatRequest(prompt="""Here is the free time for three people: Claire: 11:00-13:00, 14:00-16:00, Jack: 14:00-14:30, Ennis: 14:00-15:00, 09:00-10:00", find the time slot where everyone is free""")


