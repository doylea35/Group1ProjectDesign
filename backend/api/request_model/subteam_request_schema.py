from pydantic import BaseModel
from typing import Optional, List

class CreateSubteamRequest(BaseModel):
    team_name: str
    members: List[str] # List of Foreign Keys referencing User.email
    group: str # Foreign Key referencing Group.id
    tasks: Optional[List[str]] = None # List of Foreign Keys referencing Task.id

class DeleteSubteamRequest(BaseModel):
    team_name: str
    email: str

class AssignTaskToSubteamRequest(BaseModel):
    team_name: str
    task: str

class RemoveTaskFromSubteamRequest(BaseModel):
    team_name: str
    task: str

class GetSubteamsByGroupRequest(BaseModel):
    group_id: str

class GetTasksBySubteamRequest(BaseModel):
    subteam_id: str