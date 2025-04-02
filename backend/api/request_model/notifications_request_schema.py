from pydantic import BaseModel

class CreateNotificationRequest(BaseModel):
    """Request schema for creating a notification."""
    user_email: str # the email of the user that needs to receive the notification
    group_id: str # the group that the notification is related to
    notification_type: str
    content: str

class MarkNotificationAsReadRequest(BaseModel):
    """Request schema for marking a notification as read."""
    notification_id: str # the id of the notification to be marked as read
    user_email: str # the email of the user that needs to receive the notification

class GetNotificationsByUserRequest(BaseModel):
    """Request schema for getting notifications by user."""
    user_email: str # the email of the user that needs to receive the notification
    group_id: str # the group that the notification is related to

class GetNotificationsByGroupRequest(BaseModel):
    """Request schema for getting notifications by group."""
    group_id: str # the group that the notification is related to
    user_email: str # the email of the user that needs to receive the notification
