from db.models import Notification
from db.database import notifications_collection, groups_collection, users_collection
from db.schemas import _notification_serial, notifications_serial
from fastapi import APIRouter, HTTPException
from email_service.email_utils import email_sender
from api.utils import is_valid_email
from bson import ObjectId
from api.request_model.notifications_request_schema import CreateNotificationRequest, MarkNotificationAsReadRequest, GetNotificationsByUserRequest, GetNotificationsByGroupRequest
from datetime import datetime


notifications_router = APIRouter()

@notifications_router.post("/create_notification")
async def create_notification(request: CreateNotificationRequest):
    """
    Create a new notification.
    """
    # Validate email
    if not is_valid_email(request.user_email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check if the group exists
    if not groups_collection.find_one({"_id": ObjectId(request.group_id)}):
        raise HTTPException(
                status_code=404,
                detail=f"Group with ID {request.group_id} does not exist."
            )

    # Create a new notification
    notification = {
        "user": request.user_email,
        "task_id": request.task_id,
        "group_id": request.group_id,
        "notification_type": request.notification_type,
        "message":request.content,
        "timestamp":datetime.now(),
        "read":False
    }
    
    # Send email notification
    # email_sender.send_notification_email(request.user_email, request.notification_type, request.content)

    # Insert the notification into the database
    new_notification = notifications_collection.insert_one(notification)

    return {
        "message": "Notification created successfully",
        "data": {"id": str(new_notification.inserted_id)}  # Return only the ID
    }

@notifications_router.put("/mark_notification_as_read")
async def mark_notification_as_read(request: MarkNotificationAsReadRequest):
    """
    Mark a notification as read.
    """
    # Validate email
    if not is_valid_email(request.user_email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Check if the notification exists
    notification = notifications_collection.find_one({"_id": ObjectId(request.notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Update the notification to mark it as read
    notifications_collection.update_one(
        {"_id": ObjectId(request.notification_id)},
        {"$set": {"read": True}}
    )

    return {"message": "Notification marked as read successfully"}


@notifications_router.get("/get_notifications_by_user")
async def get_notifications_by_user(request: GetNotificationsByUserRequest):
    """
    Get notifications by user.
    """
    # Validate email
    if not is_valid_email(request.user_email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # Find notifications for the user
    notifications = notifications_serial(
        notifications_collection.find({"user": request.user_email})
    )

    return {"notifications": notifications}

@notifications_router.get("/get_notifications_by_group")
async def get_notifications_by_group(request: GetNotificationsByGroupRequest):
    """
    Get notifications by group.
    """
    # Check if the group exists
    if not groups_collection.find_one({"_id": ObjectId(request.group_id)}):
        raise HTTPException(
                status_code=404,
                detail=f"Group with ID {request.group_id} does not exist."
            )

    # Find notifications for the group
    notifications = notifications_serial(
        notifications_collection.find({"group_id": request.group_id})
    )

    return {"notifications": notifications}
