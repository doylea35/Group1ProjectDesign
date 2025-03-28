from fastapi import APIRouter, HTTPException, status, Query, Depends
from db.database import groups_collection, users_collection, chat_collection
from db.models import Group
from db.schemas import groups_serial
from api.request_model.group_request_schema import CreateGroupRequest, DeleteGroupRequest, ConfirmGroupMembershipRequest, UpdateGroupRequest
from bson import ObjectId
from email_service.email_utils import email_sender
from api.utils import is_valid_email
from api.utils import get_current_user
from dotenv import load_dotenv
import os
from pymongo import ReturnDocument

# Load environment variables
load_dotenv()

group_router = APIRouter()

frontend_url_dev = os.getenv("FRONTEND_URL_DEV")

BASE_URL = "{frontend_url}/confirmMembership/{user_email}/{group_id}"


@group_router.get("/")
async def get_groups_handler(                          
    current_user: dict = Depends(get_current_user)
):
    user_email = current_user["email"]
    if user_email:
        user = users_collection.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        query = {"_id": {"$in": [ObjectId(group_id) for group_id in user.get("groups", [])]}}
        groups =groups_serial(groups_collection.find(query))
    else:
        groups = groups_serial(groups_collection.find())
    return {"data": groups}

@group_router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_group_handler(request : CreateGroupRequest):
    if not users_collection.find_one({"email": request.creator_email}):
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {request.creator_email} does not exist."
            )

    # Create a new group object with the creator as the only member
    newGroup = {
        "members" : [request.creator_email],  
        "name": request.group_name,
        "tasks" : [],
        "pending_members": request.members
    }

    # insert into database
    inserted_group = groups_collection.insert_one(newGroup)
    print(f"inserted_group: {str(inserted_group.inserted_id)}\n")

    # send invitation email to the user
    send_project_invitation_email(request.members, request.creator_email, str(inserted_group.inserted_id), request.group_name)
    
    # created_group = groups_collection.find_one({"_id": inserted_group.inserted_id})
    newGroup["_id"] = str(inserted_group.inserted_id)
   
    # add group id to the user's "groups" field
    users_collection.find_one_and_update(
        {"email": request.creator_email}, # find by user email
        {"$addToSet": {"groups": str(inserted_group.inserted_id)}}
    , return_document=True)
    
    # create group chat
    new_chat = {
        "is_groupchat" : True,
        "participants" : [request.creator_email],
        "chat_history" : [],
        "group_id": str(inserted_group.inserted_id)
    }
    
    chat_collection.insert_one(new_chat)

    return {"data":newGroup, "message":"Group created successfully"}

@group_router.delete("/deleteGroup",  status_code=status.HTTP_200_OK)
async def delete_group_handler(request : DeleteGroupRequest):
    if not users_collection.find_one({"email": request.email}):
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {request.creator_email} does not exist."
            )
    group : Group = groups_serial([groups_collection.find_one({"group": request.group_id})])[0]

    if request.email not in group.members:
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {request.creator_email} is not a member"
            )
    return {"message": "Deletion was successful"}

    # remove_group(group_id)
    # remove_task(group_id)


@group_router.get("/confirmMembership/{user_email}/{group_id}")
async def confirm_member(user_email: str, group_id: str):

    print(f"\ngroup_id: {group_id}, user_email: {user_email}\n")
    
    group = groups_collection.find_one({"_id": ObjectId(group_id)})
    user = users_collection.find_one({"email":user_email})
    if not user:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"User with email: '{user_email}' is not a registered user."}
            )
    if not group:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Group with id: {group_id}' does not exist."}
            )
    
    updated_group = None

    if user_email in group["members"]:
        return {"message": f"Successful operation: {user_email} is already in the group."}

    if user_email not in group["pending_members"]:
        return HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": f"{user_email} is not a pending memeber in the group: {group['name']}"}
                )

    
    
    updated_group = groups_collection.find_one_and_update(
        {"_id": ObjectId(group_id)}, # find by user email
        {
            "$addToSet": {"members": user_email},
            "$pull": {"pending_members": user_email}
        }
        , return_document=True)
    


    if not updated_group:
        return HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": f"Something went wrong when adding the user to the group"}
            )

    updated_user = None
    if group_id not in user["groups"]:
        # add group id to the user's "groups" field
        updated_user = users_collection.find_one_and_update(
            {"email": user_email}, # find by user email
            {"$addToSet": {"groups": group_id}}
        , return_document=True)

        if not updated_user:
            return HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={"message": f"Something went wrong when adding the group to the user"}
                )
            
    # add new user to the chat   
    chat_collection.find_one_and_update({"group_id": ObjectId(group_id)},
                                        {"$addToSet": {"participants": user_email}})
    
    
    if updated_user:
        updated_user["_id"] = str(updated_user["_id"])
    if updated_group:
        updated_group["_id"] = str(updated_group["_id"])

    return {"message": "User is now added to the group.", "data": {"updated_group": str(updated_group), "updated_user": str(updated_user)}}


INVITATION_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GroupGrade Invitation</title>
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
        }}
        .header {{
            font-size: 24px;
            font-weight: bold;
            color: #333;
            text-align: center;
        }}
        .content {{
            font-size: 16px;
            color: #555;
            margin-top: 20px;
        }}
        .button {{
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 10px;
            text-align: center;
            background-color: #007bff;
            color: #FFFFFF;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
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
        <div class="header">You're Invited to Join "{project_name}" on GroupGrade</div>
        <div class="content">
            <p><strong>{creator_email}</strong> has invited you to join the project <strong>{project_name}</strong> on GroupGrade.</p>
            <p>Please click the button below to accept the invitation:</p>
            <a href="{invitation_link}" class="button">Accept Invitation</a>
        </div>
        <div class="footer">
            If you didn't request this invitation, please ignore this email.
        </div>
    </div>
</body>
</html>"""

def send_project_invitation_email(user_emails:list[str], creator_email:str, new_group_id:str, new_group_name:str ):

    valid_user_emails = []
    # filter out invalid emails
    for user_email in user_emails:
        if is_valid_email(user_email):
            valid_user_emails.append(user_email)


    for user_email in valid_user_emails:
        user_email_for_link = user_email
        if not users_collection.find_one({"email":user_email}):
            user_email_for_link = "notRegistered"

        email_content = INVITATION_EMAIL_TEMPLATE.format(
            creator_email=creator_email,
            project_name=new_group_name,
            invitation_link=f"{BASE_URL.format(frontend_url=frontend_url_dev, user_email=user_email_for_link, group_id=new_group_id)}"
        )
        email_sender.send_email(receipient=user_email, email_message=email_content, subject_line=f"Group Invitation from: {creator_email}")


@group_router.put("/updateGroup", status_code=status.HTTP_200_OK)
async def update_group_handler(request: UpdateGroupRequest):
    # find group
    group = groups_collection.find_one({"_id": ObjectId(request.group_id)})
    if not group:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Group with id: {request.group_id} does not exist."}
            )
    
    update_fields = {}

    # change name
    if request.new_group_name:
        update_fields["name"] = str(request.new_group_name)

    # add members
    existing_members = set(group["members"])
    pending_members = set(group.get("pending_members", []))
    
    for email in request.new_members: 
        pending_members.add(email) # we add new members to the pending list until they accept the invitation
    send_project_invitation_email(pending_members, request.modification_email, str(request.group_id), group["name"]) # and we send him the invitation email

    # remove members
    for email in request.remove_members:
        existing_members.discard(email)
        pending_members.discard(email)

    # update group
    update_fields["members"] = list(existing_members)
    update_fields["pending_members"] = list(pending_members)

    updated_group = groups_collection.find_one_and_update(
        {"_id": ObjectId(request.group_id)}, 
        {"$set": update_fields},
        return_document=True
        )
    
    if not updated_group:
        return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": f"Something went wrong when updating the group"}
            )
    
    updated_group["_id"] = str(updated_group["_id"])

    return {"message": "Group updated successfully", "data": updated_group}
