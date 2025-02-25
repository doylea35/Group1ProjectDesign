from pydantic import BaseModel
from typing import Optional, List

class CreateUserRequest(BaseModel):
    email: str
    name: str
    groups: Optional[List[str]] = None

class DeleteUserRequest(BaseModel):
    email: str

class UpdateUserRequest(BaseModel):
    email: str
    new_group_id : str
    new_name : str

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    groups: list[str]

class UserLoginRequest(BaseModel):
    email: str
    password: str