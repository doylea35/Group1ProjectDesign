from fastapi import APIRouter, HTTPException, status
from db.database import groups_collection, users_collection
from db.models import Group
from db.schemas import groups_serial
from api.request_model.group_request_schema import CreateGroupRequest, DeleteGroupRequest
group_router = APIRouter()

def sendEmails(email):
    pass

@group_router.get("/", response_model=list[Group])
async def get_groups_handler():
    groups = groups_serial(groups_collection.find())
    return groups

@group_router.post("/create", response_model=Group, status_code=status.HTTP_201_CREATED)
async def create_group_handler(request : CreateGroupRequest):
    if not users_collection.find_one({"email": request.creator_email}):
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {request.creator_email} does not exist."
            )
    
    # send invitation email to the user
    for email in request.members:
        sendEmails(email)
    
    # Create a new group object
    newGroup = {
        "members" : [request.creator_email] + request.members,  
        "name": request.group_name,
        "tasks" : []

    }

    # insert into database
    inserted_group = groups_collection.insert_one(newGroup)
    created_group = groups_collection.find_one({"_id": inserted_group.inserted_id})

    return created_group  # return full group object

@group_router.delete("/deleteGroup",  status_code=status.HTTP_201_CREATED)
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

    # remove_group(group_id)
    # remove_task(group_id)


    
