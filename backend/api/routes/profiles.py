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

# @profiles_router.get("/groups/")
# async def get_groups():
#     a = groups_collection.find()
#     print("type(group):")
#     for b in a:
#         print(type(b))
#     groups = groups_serial(groups_collection.find())
    
#     return groups

@profiles_router.get("/tasks/")
async def get_tasks():
    tasks = tasks_serial(tasks_collection.find())
    return tasks


#### POST Requests ####
# @profiles_router.post("/groups/")
# def create_group(group: Group):
#     new_group = groups_collection.insert_one(group.dict())
#     return {"id": str(new_group.inserted_id), "message": "Group created"}

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

#creates task and assigns it to user
@profiles_router.post("/tasks/")
def create_task(task: Task):

    # Check if user exists
    assigned_user = users_collection.find_one({"email": task.assigned_to})
    if not assigned_user:
        raise HTTPException(status_code=400, detail=f"User {task.assigned_to} does not exist")

    # Check if group exists
    assigned_group = groups_collection.find_one({"_id": ObjectId(task.group)})
    if not assigned_group:
        raise HTTPException(status_code=400, detail=f"Group {task.group} does not exist")

    # check if user is a member of the group
    if task.assigned_to not in assigned_group["members"]:
        raise HTTPException(status_code=400, detail=" user is not a member of the group")

    # stop duplicate tasks for one user
    existing_task = tasks_collection.find_one({
        "assigned_to": task.assigned_to,
        "name": task.name,
        "group": task.group
    })
    if existing_task:
        raise HTTPException( status_code=400, detail="task already exists for this user in the group" )

    # ensure correct status
    valid_statuses = ["To Do", "In Progress", "Completed" ]
    if task.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f" invalid status, choose from {valid_statuses}")

    # ensure correct priority
    valid_priorities = ["Low", "Medium", "High" ]
    if task.priority not in valid_priorities:
        raise HTTPException( status_code=400, detail=f"invalid priority. Choose from {valid_priorities}")

    # insert task to database
    task_data = task.dict()
    new_task = tasks_collection.insert_one(task_data)

    # include new task in groups task list
    groups_collection.update_one(
        {"_id": ObjectId(task.group)},
        {"$push": {"tasks": str(new_task.inserted_id)}}
    )

    return {
    "id": str(new_task.inserted_id),  
    "message": "task created and assigned successfully",
    "task_details": {**task_data, "_id": str(new_task.inserted_id)}  
    }


@profiles_router.put("/tasks/assign/")
def assign_task(task_id: str, new_user_email: str):
    # check if task exists
    task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="task not found")

    # check if user exists
    user = users_collection.find_one({"email": new_user_email})
    if not user:
        raise HTTPException(status_code=404, detail=" User not found")

    # task assignment
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"assigned_to": new_user_email}}
    )

    return {"message": "task assigned successfully", "task_id": task_id, "assigned_to": new_user_email}
