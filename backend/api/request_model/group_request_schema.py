from pydantic import BaseModel
from typing import List, Optional

class CreateGroupRequest(BaseModel):
    """Request schema for creating a group."""
    creator_email: str
    group_name: str
    members: List[str]

class DeleteGroupRequest(BaseModel):
    email: str
    group_id : str


class ConfirmGroupMembershipRequest(BaseModel):
    user_email: str
    group_id: str

class UpdateGroupRequest(BaseModel):
    modification_email: str # who's making the modifications
    group_id: str
    new_name: Optional[str] = None # empty string if no change
    new_members: Optional[List[str]] = [] # empty list if no change AND str of only new members if change
    remove_members: Optional[List[str]] = [] # empty list if no change AND str of only deleted members if change