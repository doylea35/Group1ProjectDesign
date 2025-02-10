from fastapi import APIRouter, HTTPException
from typing import Dict
from db.database import groups_collection, users_collection, tasks_collection
from db.models import User, Group, Task
from db.schemas import users_serial, groups_serial, tasks_serial
from bson import ObjectId # mongodb uses ObjectId to store _id

profiles_router = APIRouter()


#### GET Requests ####
@profiles_router.get("/users/")
async def get_users():
    users = users_serial(users_collection.find())
    return users

@profiles_router.get("/groups/")
async def get_groups():
    groups = groups_serial(groups_collection.find())
    return groups

@profiles_router.get("/tasks/")
async def get_tasks():
    tasks = tasks_serial(tasks_collection.find())
    return tasks


#### POST Requests ####
@profiles_router.post("/groups/")
def create_group(group: Group):
    new_group = groups_collection.insert_one(group.dict())
    return {"id": str(new_group.inserted_id), "message": "Group created"}

@profiles_router.post("/users/")
def create_user(user: User):
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    # Validate group IDs
    valid_group_ids = []
    for group_id in user.groups:
        if not groups_collection.find_one({"_id": ObjectId(group_id)}):
            raise HTTPException(status_code=400, detail=f"Group {group_id} does not exist")
        valid_group_ids.append(ObjectId(group_id))

    # Insert user
    user_dict = user.dict()
    user_dict["groups"] = valid_group_ids
    users_collection.insert_one(user_dict)

    return {"message": "User created", "email": user.email}

@profiles_router.post("/tasks/")
def create_task(task: Task):
    # Check if user exists
    if not users_collection.find_one({"email": task.assigned_to}):
        raise HTTPException(status_code=400, detail=f"User {task.assigned_to} does not exist")

    # Check if group exists
    if not groups_collection.find_one({"_id": ObjectId(task.group)}):
        raise HTTPException(status_code=400, detail=f"Group {task.group} does not exist")

    # Insert task
    new_task = tasks_collection.insert_one(task.dict())
    return {"id": str(new_task.inserted_id), "message": "Task created"}
