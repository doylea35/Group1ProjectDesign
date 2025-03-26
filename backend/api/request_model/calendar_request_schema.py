from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from db.models import FreeTimeSlot

class GetAllFreeTimeRequest(BaseModel):
    group_id : str


class UpdateUserFreeTimeRequest(BaseModel):
    added: Dict[str, List[FreeTimeSlot]] = Field(default={}, description="""{
    "Monday": [],
    "Wednesday": [
      { "start": "09:00", "end": "10:30" },
      { "start": "15:00", "end": "16:00" }
    ],
    "Saturday": [
      { "start": "09:00", "end": "10:30" },
      { "start": "15:00", "end": "16:00" }
    ]
  }""")
    
    
    removed: Dict[str, List[FreeTimeSlot]] = Field(default={}, description=""" {
    "Monday": [],
    "Wednesday": [
      { "start": "09:00", "end": "10:30" },
      { "start": "15:00", "end": "16:00" }
    ],
    "Saturday": [
      { "start": "09:00", "end": "10:30" },
      { "start": "15:00", "end": "16:00" }
    ]
  }""")
    
    

class GetOverlappingTimeSlotRequest(BaseModel):
    free_time_slots : Optional[list[Dict[str, List[FreeTimeSlot]]]] = Field(default=[], description="A list of free time slot dictionary, i.e. the free slots of each person in the group")
    group_id: str
    
    
class SendCalendarInvitationRequest(BaseModel):
    day : str # Monday - Sunday
    start : str # 00:00 - 23:59
    end : str # 00:00 - 23:59
    attendees : list[str] # list of emails (doesnt need to include the organizer's email)
    summary : Optional[str] = None
    description : Optional[str] = None