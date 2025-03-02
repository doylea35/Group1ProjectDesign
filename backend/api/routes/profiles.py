from fastapi import APIRouter, HTTPException, Query, Query
from typing import Dict, Optional
from db.database import groups_collection, users_collection, tasks_collection
from db.models import User, Group, Task
from db.schemas import users_serial, groups_serial, tasks_serial
from bson import ObjectId # mongodb uses ObjectId to store _id
from typing import List


profiles_router = APIRouter()



# returns all tasks or tasks assigned to a specific user
@profiles_router.get("/tasks/")
async def get_tasks(assigned_to: Optional[str] = Query(None, description="User email to filter tasks, or blank for all tasks")):
    query = {} if not assigned_to else {"assigned_to": assigned_to}
    tasks = tasks_serial(tasks_collection.find(query))
    return tasks


#creates task and assigns it to user
@profiles_router.post("/tasks/")
def create_task(task: Task):

    # Check if user exists
    assigned_users = [user for user in task.assigned_to if users_collection.find_one({"email": user})]    
    if not assigned_users:
        raise HTTPException(status_code=400, detail=f"User(s) {task.assigned_to} do not exist")
    # Assign only valid users
    task.assigned_to = assigned_users

    # Check if group exists
    assigned_group = groups_collection.find_one({"_id": ObjectId(task.group)})
    
    if not assigned_group:
        raise HTTPException(status_code=400, detail=f"Group {task.group} does not exist")

    # Check if all assigned users are members of the group 
    non_members = [user for user in task.assigned_to if user not in assigned_group["members"]]

    if non_members:
        raise HTTPException(status_code=400, detail=f"User(s) {non_members} are not members of the group")

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
        {"$addToSet": {"assigned_to": new_user_email}}  # add user to existing list
    )

    return {"message": "task assigned successfully", "task_id": task_id, "assigned_to": new_user_email}
