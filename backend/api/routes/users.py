from fastapi import APIRouter, HTTPException, status
from db.database import groups_collection, users_collection, tasks_collection, subteams_collection
from db.models import User
from db.schemas import users_serial
from api.request_model.user_request_schema import CreateUserRequest, DeleteUserRequest, UpdateUserRequest
from bson import ObjectId

user_router = APIRouter()

#### GET Requests ####
@user_router.get("/", response_model=list[User])
async def get_users():
    users = users_serial(users_collection.find())
    return users

#### POST Requests ####
@user_router.post("/createUser", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(request : CreateUserRequest):
    # Check if email already exists
    if users_collection.find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Email {request.email} already used"
            )

    # Validate group IDs
    valid_group_ids = []
    for group_id in request.groups:
        if not groups_collection.find_one({"_id": ObjectId(group_id)}):
            raise HTTPException(status_code=400, detail=f"Group {group_id} does not exist")
        valid_group_ids.append(ObjectId(group_id))

    # Create a new user object
    newUser = {
        "email": request.email,
        "name": request.name,
        "groups": valid_group_ids
    }

    # Insert user
    users_collection.insert_one(newUser)
    created_user = users_collection.find_one({"email": request.email})

    return created_user

#### DELETE Requests ####
@user_router.delete("/deleteUser",  status_code=status.HTTP_201_CREATED)
async def delete_user(request : DeleteUserRequest):
    # Check if user exists
    if not users_collection.find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {request.email} does not exist."
            )
    
    # Delete user
    users_collection.delete_one({"email": request.email})

    # delete user from groups
    groups_collection.update_many(
        {},
        {"$pull": {"members": request.email}}
    )

    # if there are no members in the group, delete it
    groups_collection.delete_many({"members": []})

    # if there are no members in the subteam, delete it
    subteams_collection.delete_many({"members": []})

    # delete user from tasks
    tasks_collection.delete_many({"assigned_to": request.email})



#### PUT Requests ####
@user_router.put("/updateUser", status_code=status.HTTP_201_CREATED)
async def update_user(request : UpdateUserRequest):
    # Check if user exists
    if not users_collection.find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {request.email} does not exist."
            )

    # Validate group IDs
    if not groups_collection.find_one({"_id": ObjectId(request.new_group_id)}):
        raise HTTPException(status_code=400, detail=f"Group {request.new_group_id} does not exist")

    # Update user
    users_collection.update_one(
        {"email": request.email},
        {"$set": {"name": request.new_name, "groups": [ObjectId(request.new_group_id)]}}
    )
    updated_user = users_collection.find_one({"email": request.email})

    return updated_user
    
    