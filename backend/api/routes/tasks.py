from fastapi import APIRouter, HTTPException, Query, Query, Depends
from typing import Dict, Optional
from db.database import groups_collection, users_collection, tasks_collection
from db.models import User, Group, Task, Notification
from db.schemas import users_serial, groups_serial, tasks_serial
from bson import ObjectId # mongodb uses ObjectId to store _id
from typing import List
from datetime import datetime
from api.request_model.comment_request_schema import AddCommentRequest
from api.utils import get_current_user 
from api.utils import is_valid_email 
from api.routes.notifications import create_notification
from api.request_model.notifications_request_schema import CreateNotificationRequest
from email_service.email_utils import email_sender
import os


tasks_router = APIRouter()



# returns all tasks or tasks assigned to a specific user
@tasks_router.get("/tasks/")
async def get_tasks(assigned_to: Optional[str] = Query(None, description="User email to filter tasks, or blank for all tasks")):
    query = {} if not assigned_to else {"assigned_to": assigned_to}
    tasks = tasks_serial(tasks_collection.find(query))
    return tasks


#creates task and assigns it to user
@tasks_router.post("/tasks/")
async def create_task(task: Task):

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

    # send email to new user
    for user in task.assigned_to:
        send_assigned_task_email(user, task.name, task.description, str(new_task.inserted_id), task.group, assigned_group["name"])
        # create notification for each user
        notification_dir = {
            "user_email": user,
            "group_id": task.group,
            "notification_type": "New Task",
            "content": f"You have been assigned a new task: {task.name}",
            "task_id": str(new_task.inserted_id)
        }

        # create notification in database
        notification = CreateNotificationRequest(**notification_dir)
        await create_notification(notification)

    return {
    "id": str(new_task.inserted_id),  
    "message": "task created and assigned successfully",
    "task_details": {**task_data, "_id": str(new_task.inserted_id)}  
    }


@tasks_router.put("/tasks/assign/")
async def assign_task(task_id: str, new_user_email: str):
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

    # send email to new user
    send_assigned_task_email(new_user_email, task["name"], task["description"], task_id, task["group"], task["group_name"])
    # create notification for new user
    notification_dir = {
        "user_email": new_user_email,
        "group_id": task["group"],
        "notification_type": "Task Assigned",
        "content": f"You have been assigned a new task: {task["name"]}",
        "task_id": str(task_id)
    }

    # create notification in database
    notification = CreateNotificationRequest(**notification_dir)
    await create_notification(notification)

    return {"message": "task assigned successfully", "task_id": task_id, "assigned_to": new_user_email}

@tasks_router.put("/tasks/edit/")
async def update_task(task_id: str, request_body: dict):
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

    # create notification for updated task
    for user in task["assigned_to"]:
        notification_dir = {
            "user_email": user,
            "group_id": task["group"],
            "notification_type": "Task Updated",
            "content": f"Your task has been updated: {task["name"]}",
            "task_id": str(task_id)
        }

        # create notification in database
        notification = CreateNotificationRequest(**notification_dir)
        await create_notification(notification)

    # Return a success response with the updated fields
    return {"message": "Task updated successfully", "task_id": task_id, "updated_fields": update_data}


@tasks_router.post("/tasks/{task_id}/comments", summary="Add a comment to a task")
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
    
    # create notification for each user assigned to the task
    task = tasks_collection.find_one({"_id": ObjectId(task_id)})
    for user in task["assigned_to"]:
        notification_dir = {
            "user_email": user,
            "group_id": task["group"],
            "notification_type": "Task Commented",
            "content": f"New comment on your task: {task["name"]}",
            "task_id": str(task_id)
        }

        # create notification in database
        notification = CreateNotificationRequest(**notification_dir)
        await create_notification(notification)
    
    return {"message": "Comment added successfully", "comment": new_comment}

TASK_ASSIGNMENT_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            margin: auto;
            text-align: center;
        }}
        .header {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }}
        .content {{
            font-size: 16px;
            color: #555;
            margin-top: 20px;
        }}
        .task-box {{
            border: 2px solid #a463f2;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }}
        .task-name {{
            font-size: 24px; /* Made bigger */
            font-weight: bold;
            color: #333;
            margin-bottom: 10px; /* Added space below */
        }}
        .task-description {{
            font-size: 16px; /* Kept bigger */
            color: #555;
            margin-bottom: 15px; /* More space below */
        }}
        .instruction {{
            font-size: 12px; /* Smaller text */
            color: #666;
            margin-bottom: 6px; /* Reduced space between instruction and button */
        }}
        .button {{
            display: block;
            width: 150px;
            margin: 0 auto; /* Centered button */
            padding: 12px;
            text-align: center;
            background-color: #a463f2;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
        }}
        .footer {{
            margin-top: 20px;
            font-size: 12px;
            color: #888;
            text-align: center;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">New Task Assigned: {task_name}</div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>You have been assigned a new task!</p>
            <div class="task-box">
                <div class="task-name">{task_name}</div>
                <br>
                <div class="task-description">{task_description}</div>
                <br>
                <p class="instruction">Click the button below to view and start working on your task.</p>
                <a href="{task_link}" class="button">View task</a>
            </div>
        </div>
    </div>
</body>
</html>"""


frontend_url_dev = os.getenv("FRONTEND_URL_DEV")
# BASE_URL = "{frontend_url}/tasks/{user_email}/{group_id}/{task_id}"
BASE_URL = "{frontend_url}projects/{group_id}"

def send_assigned_task_email(user_email: str, task_name: str, task_description: str, task_id: str, group_id: str, group_name: str):
    # Validate email
    if not is_valid_email(user_email):
        return {"error": "Invalid email format"}

    # Check if the user is registered
    user_email_for_link = user_email if users_collection.find_one({"email": user_email}) else "notRegistered"

    # Generate task link
    # task_link = f"{BASE_URL.format(frontend_url=frontend_url_dev, user_email=user_email_for_link, group_id=group_id, task_id=task_id)}"
    task_link = f"{BASE_URL.format(frontend_url=frontend_url_dev, group_id=group_id)}"

    # get user
    user = users_collection.find_one({"email": user_email})

    # Format email content with new template
    email_content = TASK_ASSIGNMENT_EMAIL_TEMPLATE.format(
        user_name=user["name"],  # Extracting name from email
        task_name=task_name,
        task_description=task_description,
        task_link=task_link
    )

    # Send email
    email_sender.send_email(
        receipient=user_email,
        email_message=email_content,
        subject_line=f"New Task Assigned {task_name} from {group_name}"
    )

    return {"message": "Task assignment email sent successfully", "task_id": task_id, "assigned_to": user_email}


