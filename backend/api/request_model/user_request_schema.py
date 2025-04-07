from pydantic import BaseModel
from typing import Optional, List
from fastapi import File, UploadFile

class CreateUserRequest(BaseModel):
    email: str
    name: str
    groups: Optional[List[str]] = None
    skills: Optional[List[str]] = None

class DeleteUserRequest(BaseModel):
    email: str

class UpdateUserRequest(BaseModel):
    email: str
    new_name : Optional[str] = None # if the user wants to update their name
    add_skills: Optional[List[str]] = None # if the user wants to update their skills
    remove_skills: Optional[List[str]] = None # if the user wants to remove their skills

class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    groups: list[str]
    skills: list[str]

class UserLoginRequest(BaseModel):
    email: str
    password: str
