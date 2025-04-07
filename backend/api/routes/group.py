from fastapi import APIRouter, HTTPException, status, Depends
from db.database import groups_collection, users_collection, chat_collection
from db.models import Group
from db.schemas import groups_serial, users_serial
from api.request_model.group_request_schema import CreateGroupRequest, DeleteGroupRequest, UpdateGroupRequest
from bson import ObjectId
from email_service.email_utils import email_sender
from api.utils import is_valid_email
from api.utils import get_current_user
from dotenv import load_dotenv
import os


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
        groups_cursor = groups_collection.find(query)
    else:
        groups_cursor = groups_collection.find()

    # Retrieve groups and serialize them using your groups_serial function
    groups_list = list(groups_cursor)
    groups_data = groups_serial(groups_list)

    # Collect all member emails from the groups
    member_emails = set()
    for group in groups_list:
        member_emails.update(group.get("members", []))
    # Query the users_collection for all members using the gathered emails
    users_cursor = users_collection.find({"email": {"$in": list(member_emails)}})
    users_list = list(users_cursor)
    serialized_users = users_serial(users_list)  # Use your provided serialization function
    # Create a mapping from email to serialized User
    user_map = {user.email: user for user in serialized_users}

    # For each group, attach a new key "members_details" with the corresponding User objects
    groups_with_members = []
    for group in groups_data:
        group_dict = group.model_dump()
        group_dict["members_details"] = [
            user_map[email] for email in group.members if email in user_map
        ]
        groups_with_members.append(group_dict)

    return {"data": groups_with_members}

@group_router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_group_handler(request : CreateGroupRequest):
    user = users_collection.find_one({"email": request.creator_email})
    if not user:
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {request.creator_email} does not exist."
            )

    # Create a new group object with the creator as the only member
    if request.creator_email in request.members:
        request.members.remove(request.creator_email)
    newGroup = {
        "members" : [request.creator_email],  
        "name": request.group_name,
        "tasks" : [],
        "pending_members": request.members,
        "member_names": {request.creator_email: user["name"]}
    }

    # insert into database
    inserted_group = groups_collection.insert_one(newGroup)

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

@group_router.get("/confirmMembership/{user_email}/{group_id}")
async def confirm_member(user_email: str, group_id: str):

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
        return {"message": f"Successful operation: {user_email} is already in the group.", "status_code": status.HTTP_200_OK}

    if user_email not in group["pending_members"]:
        return HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"message": f"{user_email} is not a pending memeber in the group: {group['name']}"}
                )
    
    email_key = user_email

    # Encode the key by replacing the dot with a placeholder (e.g., "[dot]")
    encoded_email = email_key.replace('.', '[dot]')
    
    updated_group = groups_collection.find_one_and_update(
        {"_id": ObjectId(group_id)},
        {
            "$addToSet": {"members": user_email},
            "$set": {f"member_names.{encoded_email}": user["name"]},
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
    chat_collection.find_one_and_update({"group_id": group_id},
                                        {"$addToSet": {"participants": user_email}})
    
    
    if updated_user:
        updated_user["_id"] = str(updated_user["_id"])
    if updated_group:
        updated_group["_id"] = str(updated_group["_id"])

    return {"message": "User is now added to the group.", "data": {"updated_group": str(updated_group), "updated_user": str(updated_user)}}


INVITATION_EMAIL_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Group Invitation - GroupGrade</title>
  <style>
    body {{
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      font-family: 'Poppins', sans-serif;
      color: #1f2937;
    }}
    .container {{
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      padding: 40px 30px;
      text-align: center;
    }}
    .logo {{
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
    }}
    .title {{
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 8px;
    }}
    .subtitle {{
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 24px;
    }}
    .button {{
      display: inline-block;
      background-color: #6C38F5;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 16px;
      font-weight: bold;
      border-radius: 9999px;
      padding: 14px 32px;
      margin-top: 20px;
    }}
    .button:hover {{
      background-color: #5932ea;
    }}
    .note {{
      font-size: 13px;
      color: #777;
      margin-top: 24px;
    }}
    .footer {{
      font-size: 12px;
      color: #aaa;
      margin-top: 40px;
    }}
    a {{
      color: #6C38F5;
      text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="container">
    <img class="logo" src="https://group-grade-files.s3.eu-north-1.amazonaws.com/groupgrade-assets/hexlogo.png" alt="GroupGrade Logo" />
    <div class="title">You're Invited to Join "{project_name}"</div>
    <div class="subtitle">Collaborate on GroupGrade — Teamwork Made Easy</div>

    <p><strong>{creator_email}</strong> has invited you to join the project <strong>{project_name}</strong> on GroupGrade.</p>
    <p>Click below to accept the invitation and start working with your team:</p>

    <a href="{invitation_link}" class="button">Accept Invitation</a>

    <div class="note">
      Didn't expect this? You can safely ignore this message.
    </div>
    <div class="footer">
            Need help? Contact us at <a href="mailto:support@groupgrade.com">support@groupgrade.com</a><br/>
            &copy; 2025 GroupGrade. All rights reserved.
    </div>
  </div>  
</body>
</html>
"""


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
