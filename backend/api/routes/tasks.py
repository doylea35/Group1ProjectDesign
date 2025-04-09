from fastapi import APIRouter, HTTPException, Query, Query, Depends
from typing import Dict, Optional
from db.database import groups_collection, users_collection, tasks_collection, subteams_collection
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
from params.frontend_params import frontend_url
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

    # Validate group
    assigned_group = groups_collection.find_one({"_id": ObjectId(task.group)})
    if not assigned_group:
        raise HTTPException(status_code=400, detail=f"Group {task.group} does not exist")

    assigned_to = task.assigned_to
    subteam_id = None

    if len(assigned_to) == 1:
        possible_subteam_id = assigned_to[0]
        try:
            subteam = subteams_collection.find_one({"_id": ObjectId(possible_subteam_id)})
        except:
            subteam = None

        if subteam:
            subteam_id = possible_subteam_id
            assigned_to = subteam["members"]  # Get members of subteam

            # Make sure all members are part of the group
            non_members = [user for user in assigned_to if user not in assigned_group["members"]]
            if non_members:
                raise HTTPException(status_code=400, detail=f"User(s) {non_members} in subteam are not part of the group")

            # Send emails to subteam members
            send_assigned_task_email_subteam(
                subteam_id=subteam_id,
                task_name=task.name,
                task_description=task.description,
                task_id="pending",  # Will update after insertion
                group=assigned_group
            )

        else:
            # Not a subteam, continue as individual user assignment
            assigned_to = [user for user in assigned_to if users_collection.find_one({"email": user})]
            if not assigned_to:
                raise HTTPException(status_code=400, detail=f"No valid users found in {task.assigned_to}")
    else:
        # Individual users case
        assigned_to = [user for user in assigned_to if users_collection.find_one({"email": user})]
        if not assigned_to:
            raise HTTPException(status_code=400, detail=f"No valid users found in {task.assigned_to}")

    # Check duplicate task for same users
    existing_task = tasks_collection.find_one({
        "assigned_to": assigned_to,
        "name": task.name,
        "group": task.group
    })
    if existing_task:
        raise HTTPException(status_code=400, detail="Task already exists for this user/subteam in the group")

    # Validate task status and priority
    valid_statuses = ["To Do", "In Progress", "Completed"]
    valid_priorities = ["Low", "Medium", "High"]
    if task.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status, choose from {valid_statuses}")
    if task.priority not in valid_priorities:
        raise HTTPException(status_code=400, detail=f"Invalid priority, choose from {valid_priorities}")

    # Prepare and insert task
    task_data = task.dict()
    task_data["assigned_to"] = assigned_to
    if subteam_id:
        task_data["subteam"] = str(subteam_id)  # Store subteam ID as string

    new_task = tasks_collection.insert_one(task_data)

    # Update group's task list
    groups_collection.update_one(
        {"_id": ObjectId(task.group)},
        {"$push": {"tasks": str(new_task.inserted_id)}}
    )

    # Send emails to individual users if not subteam
    if not subteam_id:
        for user in assigned_to:
            send_assigned_task_email(
                user_email=user,
                task_name=task.name,
                task_description=task.description,
                task_id=str(new_task.inserted_id),
                group_id=task.group,
                group_name=assigned_group["name"]
            )

            # Create notification for each user
            notification_dir = {
                "user_email": user,
                "group_id": task.group,
                "notification_type": "Task Assigned",
                "content": f"You have been assigned a new task: {task.name}",
                "task_id": str(new_task.inserted_id)
            }
            notification = CreateNotificationRequest(**notification_dir)
            await create_notification(notification)

    return {
        "id": str(new_task.inserted_id),
        "message": "Task created and assigned successfully",
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
        "content": f"You have been assigned a new task: {task['name']}",
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
    allowed_fields = ["name", "description", "due_date", "status", "priority", "labels"]

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
            "content": f"Your task has been updated: {task['name']}",
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
            "content": f"New comment on your task: {task['name']}",
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
        .logo {{
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            display: block;
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
            border: 4px solid #a463f2;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }}
        .task-name {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }}
        .task-description {{
            font-size: 16px;
            color: #555;
            margin-bottom: 15px;
        }}
        .instruction {{
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }}
        .button {{
            display: block;
            width: 150px;
            margin: 0 auto;
            padding: 12px;
            text-align: center;
            background-color: #a463f2;
            color: #FFFFFF !important;
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
        <img class="logo" src="https://group-grade-files.s3.eu-north-1.amazonaws.com/groupgrade-assets/hexlogo.png" alt="GroupGrade Logo" />
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
                <a href="{task_link}" class="button" 
                   style="color: #FFFFFF !important; text-decoration: none !important;">
                   View task
                </a>
            </div>
            <div class="footer">
                   Need help? Contact us at <a href="mailto:support@groupgrade.com">support@groupgrade.com</a><br/>
                   &copy; 2025 GroupGrade. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>"""




# frontend_url_dev = os.getenv("FRONTEND_URL_DEV")
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
    task_link = f"{BASE_URL.format(frontend_url=frontend_url, group_id=group_id)}"

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


TASK_ASSIGNMENT_EMAIL_TEMPLATE_SUBTEAM = """<!DOCTYPE html>
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
        .logo {{
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            display: block;
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
            border: 4px solid #a463f2;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }}
        .task-name {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }}
        .task-description {{
            font-size: 16px;
            color: #555;
            margin-bottom: 15px;
        }}
        .instruction {{
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }}
        .button {{
            display: block;
            width: 150px;
            margin: 0 auto;
            padding: 12px;
            text-align: center;
            background-color: #a463f2;
            color: #FFFFFF !important;
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
        <img class="logo" src="https://group-grade-files.s3.eu-north-1.amazonaws.com/groupgrade-assets/hexlogo.png" alt="GroupGrade Logo" />
        <div class="header">New Task Assigned: {task_name}</div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>Your subteam {subteam_name} has been assigned a new task!</p>
            <div class="task-box">
                <div class="task-name">{task_name}</div>
                <br>
                <div class="task-description">{task_description}</div>
                <br>
                <p class="instruction">Click the button below to view and start working on your task.</p>
                <a href="{task_link}" class="button" 
                   style="color: #FFFFFF !important; text-decoration: none !important;">
                   View task
                </a>
            </div>
            <div class="footer">
                   Need help? Contact us at <a href="mailto:support@groupgrade.com">support@groupgrade.com</a><br/>
                   &copy; 2025 GroupGrade. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>"""

def send_assigned_task_email_subteam(subteam_id: str, task_name: str, task_description: str, task_id: str, group: dict):
    """
    Sends task assignment emails to all members of a subteam given its ID.
    """
    # Fetch subteam from DB
    subteam = subteams_collection.find_one({"_id": ObjectId(subteam_id)})
    if not subteam:
        return {"error": f"Subteam with ID {subteam_id} not found."}

    for user_email in subteam["members"]:
        # Validate email format
        if not is_valid_email(user_email):
            continue  # Skip invalid emails

        # Use fallback in case user is not in DB
        user = users_collection.find_one({"email": user_email})
        user_email_for_link = user_email if user else "notRegistered"

        # Generate task link
        task_link = f"{BASE_URL.format(frontend_url=frontend_url_dev, group_id=group['_id'])}"

        if not user:
            continue  # Skip if user doesn't exist

        # Format email content using subteam template
        email_content = TASK_ASSIGNMENT_EMAIL_TEMPLATE_SUBTEAM.format(
            user_name=user["name"],
            subteam_name=subteam["team_name"],
            task_name=task_name,
            task_description=task_description,
            group_name=group["name"],
            task_link=task_link
        )

        # Send email
        email_sender.send_email(
            receipient=user_email,
            email_message=email_content,
            subject_line=f"New Task Assigned to Subteam '{subteam['team_name']}' - {task_name}"
        )

    return {
        "message": "Subteam task notification emails sent successfully",
        "task_id": task_id,
        "subteam": subteam["team_name"]
    }