from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime

class Comment(BaseModel):
    commenter: str         # email or identifier of the user
    content: str           # comment text
    timestamp: datetime    # date/time of comment

class FreeTimeSlot(BaseModel):
    start: str
    end: str

class User(BaseModel):
    id: Optional[str] = Field(alias="_id", default=None)
    email: str # Primary Key ; en un futur plantejar fer-ho amb EmailStr, requerreix email validator
    name: str
    groups: Optional[List[str]] = [] # List of Foreign Keys referencing Group.id
    free_time: Optional[Dict[str, List[FreeTimeSlot]]] = {} # optional free_time, by default is {}
    password: Optional[str]
    token: Optional[str]
    status: Optional[str]
    confirmation_code: Optional[str]

class Group(BaseModel): #_id as Primary key, automatically created, can be found using ObjectID
    id: Optional[str] = Field(alias="_id", default=None)  # Include MongoDB _id
    members: List[str] # List of Foreign Keys referencing User.email
    name: str
    tasks: Optional[List[str]] = None # List of Foreign Keys referencing Task.id
    pending_members:Optional[List[str]] =[]

class Task(BaseModel):
    assigned_to: List[str]         # List of foreign keys referencing User.email
    name: str
    description: str
    due_date: str
    status: str                    # ["To Do", "In Progress", "Completed"]
    group: str                     # Foreign Key referencing Group.id
    priority: str                  # ["Low", "Medium", "High"]
    labels: Optional[List[str]] = []   # array of labels, optional 
    comments: Optional[List[Comment]] = []  # field for comments 

class SubTeam(BaseModel): #_id as Primary key, automatically created, can be found using ObjectID
    id: Optional[str] = Field(alias="_id", default=None)
    team_name: str 
    members: List[str]  # List of Foreign Keys referencing User.email
    tasks: List[str] # List of Foreign Keys referencing Task.id
    group: str # Foreign Key referencing Group.id


class Message(BaseModel):
    message_id: str = Field(alias="_id", default=None)
    sender: str
    message: str
    delivered_time : datetime
    
class Chat(BaseModel):
    chat_id: str = Field(alias="_id", default=None)
    is_groupchat: bool = False
    participants: list[str] = []
    chat_history: list[Message] = []
    group_id : str = None