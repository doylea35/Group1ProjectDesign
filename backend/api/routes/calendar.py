from fastapi import APIRouter, HTTPException, status, Depends
from db.database import users_collection, groups_collection
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from api.utils import is_valid_email
import json
from api.request_model.calendar_request_schema import GetAllFreeTimeRequest, UpdateUserFreeTimeRequest, GetOverlappingTimeSlotRequest, SendCalendarInvitationRequest
from api.utils import get_current_user
from bson import ObjectId
from calendar_service.google_calendar_service import google_calendar_client

# Load API Key from environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

calendar_router = APIRouter()

# Define a request model
class ChatRequest(BaseModel):
    prompt: str
    max_tokens: int = 10000


@calendar_router.get("/getUserFreeTime")
async def get_user_freetime_for_user(current_user: dict = Depends(get_current_user)):
    user_email = current_user["email"]
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


@calendar_router.put("/getGroupFreeTime")
async def get_all_freetime_for_user(request : GetAllFreeTimeRequest, current_user: dict = Depends(get_current_user)):
    free_time_slots = []
    cur_group = groups_collection.find_one({"_id": ObjectId(request.group_id)})
    if not cur_group:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Group does not exist."
        )
        
    for member_email in cur_group["members"]:
      user = users_collection.find_one({"email": member_email})
      if user is not None:
        if user["free_time"] is not None:
          obj = {
              "name": user["name"],
              "email": user["email"],
              "free_time": user["free_time"]
          }
          free_time_slots.append(obj)
    
    return {"message": "Here are the free time slot", "data":free_time_slots}
  
  
@calendar_router.post("/sendCalendarInvite")
async def send_calendar_invitation(request :SendCalendarInvitationRequest, current_user: dict = Depends(get_current_user)):
    user_email = current_user["email"]
    
    if not is_valid_email(user_email):
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email: {user_email} is not a valid email"
            )
        
    summary = f"{user_email}: Weekly meeting"
    if request.summary is not None:
        summary = request.summary
    
    description = f"Weekly meeting organized by {user_email} through GroupGrade"
    if request.description is not None:
        description = request.description
        
    attendee_emails = request.attendees
    
    if user_email not in attendee_emails:
        attendee_emails.append(user_email)
        
    print(f"\n\n\n google_calendar_client: {google_calendar_client}\n\n\n")
        
    start_datetime, end_datetime = google_calendar_client.get_next_weekday_datetime(request.day, request.start, request.end)
    
    google_calendar_client.create_event(summary, description, start_datetime, end_datetime, attendee_emails)
    
    return {"message": "Google Calendar Inivitation Sent!"}

    
  
    
@calendar_router.put("/updateFreeTime")
async def update_free_time(request : UpdateUserFreeTimeRequest, current_user: dict = Depends(get_current_user)):
    user_email = current_user["email"]
    free_time_added = request.added
    free_time_removed = request.removed

    if not is_valid_email(user_email):
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email: {user_email} is not a valid email"
            )

    # Validate input
    if not isinstance(free_time_added, dict) or not isinstance(free_time_removed, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid free time format. Expected a dictionary."
          )
    
    
    for day, slots in free_time_added.items():
      if len(slots) > 0:
        slots_to_be_added = [slot.model_dump() for slot in slots]
        users_collection.update_one(
          {"email": user_email},
          
          {"$addToSet": {f"free_time.free_time.{day}": {"$each": slots_to_be_added}}}
        )
        
    for day, slots in free_time_removed.items():
      # print(day)
      for slot in slots:
            users_collection.update_one(
                {"email": user_email},
                {"$pull": {f"free_time.free_time.{day}": slot.model_dump()}}
            )
    
    # Retrieve the updated user document to send back as response
    updated_user = users_collection.find_one({"email": user_email})
    if updated_user:
        updated_user["_id"] = str(updated_user["_id"])
        return {"message": "Free time updated successfully", "data": updated_user["free_time"]}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free time slots update failed. Please try again."
        )

PROMPT_TEMPLATE = """
You are given a list of free time slots for multiple people. Your task is to find the overlapping time slots across all users.
Now, given the following free time slots: {time_slots}, find the overlapping free time slots (if any).

### **Example Input 1:**
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
Expected output 1: 
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

### **Example Input 2:**
[
  {{
    "Monday": [],
    "Friday": [
      {{ "start": "09:00", "end": "10:30" }},
      {{ "start": "15:00", "end": "16:00" }}
    ],
    "Thursday": [
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
Expected output 2: 
{{}}

Return the response strictly in JSON format like the example above, with no additional text or explanations. If no overlapping slots exist, return an empty JSON object {{}} with out ```json ```. so pure text only. Please follow the output format strictly. I don't want you to output any extra text in the response other than either a dictionary containing the free times or an empty dictionary {{}} when there is no overlapping free time. 
"""


MAX_TOKEN = 10000

@calendar_router.post("/getOverlappingTime")
async def ask_chatgpt_for_free_time(request: GetOverlappingTimeSlotRequest, current_user: dict = Depends(get_current_user)):
    free_time_slots : list[dict] = []

    if len(request.free_time_slots) > 0:
        free_time_slots = request.free_time_slots
    else:
        cur_group = groups_collection.find_one({"_id": ObjectId(request.group_id)})
        # print(f"cur_group: {cur_group}")
        if cur_group is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Group does not exist."
            )

        for member_email in cur_group["members"]:
          user = users_collection.find_one({"email": member_email})
          # print(f"user: {user}")
          if user is not None:
            if len(user["free_time"]) > 0:
              free_time_slots.append(user["free_time"])
    try:
        processed_slots = [
        {
            day: [slot if isinstance(slot, dict) else json.loads(slot) if isinstance(slot, str) else slot for slot in slots]
            for day, slots in user_slots.get("free_time", {}).items()
        }
            for user_slots in free_time_slots
        ]

        processed_slots_json = json.dumps(processed_slots, indent=2)
        # print(f"processed_slots_json: {str(processed_slots_json)}")
        # print(f"processed_slots: {str(processed_slots_json)}")

        # Prepare the final prompt
        formatted_prompt = PROMPT_TEMPLATE.format(time_slots=str(processed_slots_json))
        # print("formyed prompts")
        print(f"\n\nformatted_prompt: {formatted_prompt}\n\n")
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
            return {"data":overlapping_free_time}  # Return the structured JSON response
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Invalid JSON response from OpenAI"
            )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR , detail=str(e))
    




TEMPLATE_2 = """

Query: "Given the following data: {free_time}, can you tell me the free times where all the people can have at least {duration} minutes to meet. Can you only tell me the final answer, I don't want you to tell me your thought process. And response in strictly in plain text only. If there is no such time exists from the given data. Find the time(s) that suits most people and also list their names beside each available time."

Data interpretation: 
the interpretation of "{{"name": "James", "start": "11:20", "end": "12:10"}}" means "James" is free between 11:20 to 12:10.

Sample Input:

{{
"free_time_slots" :
    {{"name": "Alice", "start": "10:00", "end": "11:00"}},
    {{"name": "Bob", "start": "10:15", "end": "11:30"}},
    {{"name": "Charlie", "start": "10:30", "end": "11:15"}}
],
"duration": 30
}}

Sample output:
"Alice, Bob, and Charlie are all free from 10:30 to 11:00, which fits the 30-minute requirement."

"""


class FindMeetingSlotRequest(BaseModel):
   
   free_time_slots : list[dict] = []
   duration : int = 30

@calendar_router.post("/getMeetingTime")
async def ask_chatgpt_for_free_time(request : FindMeetingSlotRequest):
  formatted_prompt = TEMPLATE_2.format(free_time=str(request.free_time_slots), duration=request.duration)
  try:
    response = openai.ChatCompletion.create(
            model="o3-mini",  # Use "gpt-4o" for best performance
            messages=[{"role": "user", "content": formatted_prompt}],
            max_completion_tokens=10000,  # Limit response length
        )
    print(f"response: { str(response)}")
    return {"data": response["choices"][0]["message"]["content"]}
  except Exception as e:
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR , detail=str(e))
  

# timedata = [
#     {"name": "user 1", "start": "08:00", "end": "09:30"},
#     {"name": "user 1", "start": "11:00", "end": "12:00"},
#     {"name": "user 2", "start": "08:15", "end": "09:45"},
#     {"name": "user 2", "start": "11:30", "end": "12:30"},
#     {"name": "user 3", "start": "08:30", "end": "10:00"},
#     {"name": "user 3", "start": "11:15", "end": "12:15"},
#     {"name": "user 4", "start": "08:45", "end": "09:15"},
#     {"name": "user 4", "start": "11:00", "end": "11:45"},
#     {"name": "user 5", "start": "09:00", "end": "09:50"},
#     {"name": "user 5", "start": "11:10", "end": "12:05"},
#     {"name": "user 6", "start": "08:00", "end": "10:00"},
#     {"name": "user 6", "start": "11:20", "end": "12:10"}
# ]




# req = FindMeetingSlotRequest(free_time_slots=timedata, duration=40)

