from fastapi import APIRouter, HTTPException, status
from db.database import groups_collection, users_collection
from db.models import Group
from db.schemas import groups_serial, group_serial
from api.request_model.group_request_schema import CreateGroupRequest, DeleteGroupRequest
from bson import ObjectId

group_router = APIRouter()

def sendEmails(email):
    pass

@group_router.get("/", response_model=list[Group])
async def get_groups_handler():
    groups = groups_serial(groups_collection.find())
    return groups

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
        "tasks" : []

    }

    # insert into database
    inserted_group = groups_collection.insert_one(newGroup)
    print(f"inserted_group: {str(inserted_group.inserted_id)}\n")

    # send invitation email to the user
    for email in request.members:
        sendEmails(email)
    
    # created_group = groups_collection.find_one({"_id": inserted_group.inserted_id})
    newGroup["_id"] = str(inserted_group.inserted_id)
   
    # add group id to the user's "groups" field
    updated_user = users_collection.find_one_and_update(
        {"email": request.creator_email}, # find by user email
        {"$addToSet": {"groups": str(inserted_group.inserted_id)}}
    , return_document=True)

    # print(f"\ncreated_group: {created_group}\n")

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


@group_router.put("/confirmMember/{user_email}/{group_id}")
async def confirm_member(user_email: str, group_id: str):
    # assume the user exist in our database
    # TODO ask the frontend to first check if the user exists or not, if not, ask user to register first then call this api
    if not groups_collection.find_one({"_id": ObjectId(group_id)}):
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Group with _id {group_id} does not exist."
            )
    
    # add group id to the user's "groups" field
    updated_user = users_collection.find_one_and_update(
        {"email": user_email}, # find by user email
        {"$addToSet": {"groups": group_id}}
    , return_document=True)

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Something went wrong when adding the new group to the user."
        )

    updated_group = groups_collection.find_one_and_update(
        {"_id": ObjectId(group_id)}, # find by user email
        {"$addToSet": {"members": user_email}}
    , return_document=True)

    if not updated_group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Something went wrong when adding the user to the group"
        )
    
    updated_user["_id"] = str(updated_user["_id"])
    updated_group["_id"] = str(updated_group["_id"])
    
    return {"message": "User is now added to the group.", "updated_group": str(updated_group), "updated_user": str(updated_user)}

