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