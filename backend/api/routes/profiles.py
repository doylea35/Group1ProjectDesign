from fastapi import APIRouter, HTTPException, Query, Query, Depends
from typing import Dict, Optional
from db.database import groups_collection, users_collection, tasks_collection
from db.models import User, Group, Task
from db.schemas import users_serial, groups_serial, tasks_serial
from bson import ObjectId # mongodb uses ObjectId to store _id
from typing import List
from datetime import datetime
from api.request_model.comment_request_schema import AddCommentRequest
from api.utils import get_current_user  


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

@profiles_router.put("/tasks/edit/")
def update_task(task_id: str, request_body: dict):
    print(f"Received task_id: {task_id}")
    print(f"Updated fields received: {request_body}")

    # extract 'updated_fields' from request body 
    updated_fields = request_body.get("updated_fields", {})

    task = tasks_collection.find_one({"_id": ObjectId(task_id)})

    # If no task is found, return a 404 error
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Define the list of allowed fields that can be updated
    allowed_fields = ["name", "description", "due_date", "status", "priority"]

    # Filter out any fields that are not in the allowed list
    update_data = {key: value for key, value in updated_fields.items() if key in allowed_fields}

     # If no valid fields remain after filtering, return a 400 error
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    # Perform the update in the database by setting the new values
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": update_data}
    )

    # Return a success response with the updated fields
    return {"message": "Task updated successfully", "task_id": task_id, "updated_fields": update_data}


@profiles_router.post("/tasks/{task_id}/comments", summary="Add a comment to a task")
async def add_comment(task_id: str, comment_request: AddCommentRequest, current_user: dict = Depends(get_current_user)):
    # create the comment object 
    new_comment = {
        "commenter": current_user["email"],
        "content": comment_request.content,
        "timestamp": datetime.utcnow()
    }
    
    # append tasks to current list of tasks
    result = tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"comments": new_comment}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found or comment not added")
    
    return {"message": "Comment added successfully", "comment": new_comment}
