from pydantic import BaseModel
from typing import List

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
    new_group_name: str
    new_members: List[str]