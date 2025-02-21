from pydantic import BaseModel
from typing import Optional, List

class CreateSubteamRequest(BaseModel):
    team_name: str
    members: List[str]
    group: str
    tasks: Optional[List[str]] = None

class DeleteSubteamRequest(BaseModel):
    team_name: str
    email: str
