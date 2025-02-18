from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from db.models import FreeTimeSlot
from db.database import users_collection
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from api.utils import is_valid_email
import json
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

PROMPT_TEMPLATE = """
You are given a list of free time slots for multiple people. Your task is to find the overlapping time slots across all users.
Now, given the following free time slots: {time_slots}, find the overlapping free time slots (if any).

### **Example Input:**
[
  {{
    "Monday": [],
    "Wednesday": [
      {{ "start": "09:00", "end": "10:30" }},
      {{ "start": "15:00", "end": "16:00" }}
    ],
    "Saturday": [
      {{ "start": "09:00", "end": "10:30" }},
      {{ "start": "15:00", "end": "16:00" }}
    ]
  }},
  {{
    "Monday": [],
    "Wednesday": [
      {{ "start": "09:00", "end": "10:00" }},
      {{ "start": "15:00", "end": "16:00" }}
    ],
    "Saturday": [
      {{ "start": "09:00", "end": "10:00" }},
      {{ "start": "15:50", "end": "16:00" }}
    ]
  }}
]
Expected output: 
{{
  "Monday": [],
  "Wednesday": [
    {{ "start": "09:00", "end": "10:00" }},
    {{ "start": "15:00", "end": "16:00" }}
  ],
  "Saturday": [
    {{ "start": "09:00", "end": "10:00" }},
    {{ "start": "15:50", "end": "16:00" }}
  ]
}}
Return the response strictly in JSON format like the example above, with no additional text or explanations. If no overlapping slots exist, return an empty JSON object {{}} with out ```joson ```. so pure text only.. 
"""


MAX_TOKEN = 10000

@calendar_router.post("/getOverlappingTime")
async def ask_chatgpt_for_free_time(free_time_slots : list[Dict[str, List[FreeTimeSlot]]]):
    try:
        print("ask_chatgpt_for_free_time\n")

        processed_slots = [
        {
            day: [slot if isinstance(slot, dict) else slot.dict() for slot in slots]
            for day, slots in user_slots.items()
        }
        for user_slots in free_time_slots
        ]

        processed_slots_json = json.dumps(processed_slots, indent=2)
        # print(f"processed_slots: {str(processed_slots_json)}")

        # Prepare the final prompt
        formatted_prompt = PROMPT_TEMPLATE.format(time_slots=str(processed_slots_json))
        # print("formyed prompts")

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-4o",  # Use "gpt-4o" for best performance
            messages=[{"role": "user", "content": formatted_prompt}],
            max_tokens=1000,  # Limit response length
        )

        # Extract the response content
        gpt_response = response["choices"][0]["message"]["content"]
        # print(f"model respons: {gpt_response}\n")
        # Parse JSON output from GPT
        try:
            overlapping_free_time = json.loads(gpt_response)
            return overlapping_free_time  # Return the structured JSON response
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid JSON response from OpenAI"
            )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR , detail=str(e))