from fastapi import APIRouter, HTTPException, Query,  Depends, status, Body
from typing import Dict, Optional
from db.database import groups_collection, users_collection, tasks_collection, subteams_collection
from db.models import User, Group, Task
from db.schemas import users_serial, groups_serial, tasks_serial
from api.request_model.user_request_schema import CreateUserRequest, DeleteUserRequest, UpdateUserRequest, UserRegisterRequest, UserLoginRequest
from bson import ObjectId # mongodb uses ObjectId to store _id
import bcrypt
import jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
import os
from email_service.email_utils import email_sender
from pydantic import BaseModel
from pymongo import ReturnDocument

# Load environment variables
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret")

# OAuth2 password bearer for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")


user_router = APIRouter()

frontend_url_dev = os.getenv("FRONTEND_URL_DEV")

BASE_URL = "{frontend_url}/confirmRegistration/{confirmationCode}"

# Function to hash passwords
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(11)
    hashed_password =  bcrypt.hashpw(password.encode("utf-8"), salt)
    # Ensure it is bytes before decoding
    if isinstance(hashed_password, bytes):
        return hashed_password.decode("utf-8")  # Convert bytes to string
    return hashed_password  # If already string, return as is


# Function to verify passwords
def verify_password(plain_password: str, hashed_password : str) -> bool:
    # real_password = None
    # if type(hash_password) is bytes:
    #     real_password.decode("utf-8")
    # else:
    print(f"plain_password: {plain_password}, hashed_password.encode('utf-8'): {hashed_password.encode('utf-8')} ")
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# Function to generate JWT token
def generate_token(user_id: str, user_email:str) -> str:
    return jwt.encode({"id": user_id, "email": user_email}, JWT_SECRET, algorithm="HS256")


# Middleware to get current user
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = users_collection.find_one({"_id": payload["id"]})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@user_router.post("/register")
async def register_user(request : UserRegisterRequest):
    existing_user = users_collection.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(request.password)
    confirmation_code = "123"

    # Validate group IDs
    valid_group_ids = []
    for group_id in request.groups:
        if not groups_collection.find_one({"_id": ObjectId(group_id)}):
            raise HTTPException(status_code=400, detail=f"Group {group_id} does not exist")
        valid_group_ids.append(ObjectId(group_id))
    
    # hashed_password_str = hashed_password.decode("utf-8")
    # print(f"type of hashed_password_str = {type(hashed_password_str)}")

    # new_user = User(name=request.name, email=request.email, password=request.password, status="Pending", confirmation_code=confirmation_code, groups=valid_group_ids, free_time={})
    new_user = {
        "name": request.name,
        "email": request.email,
        "password": hashed_password,
        "status": "Pending",
        "confirmation_code": confirmation_code,
        "groups":valid_group_ids,
        "free_time": {},
        "skills": request.skills
    }

    result = users_collection.insert_one(new_user)
    unique_token = generate_token(str(result.inserted_id), request.email)
    
    users_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"confirmation_code": unique_token}}
    )

    confirmation_link = BASE_URL.format(frontend_url=frontend_url_dev,confirmationCode=unique_token)

    message = REGISTRATION_CONFIRMATION_EMAIL_TEMPLATE.format(
        user_name=request.name,
        confirmation_link=confirmation_link
    )

    # Send confirmation email
    email_sender.send_email(receipient=request.email, email_message=message, subject_line="Please confirm your email.")

    return {
        "id": str(result.inserted_id),
        "name": request.name,
        "email": request.email,
        "token": unique_token,
        "status": "Pending",
        "confirmation_code": unique_token,
    }


@user_router.get("/confirm/{confirmationCode}")
async def verify_user(confirmationCode: str):
    user = users_collection.find_one({"confirmation_code": confirmationCode})
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    users_collection.update_one(
        {"confirmation_code": confirmationCode},
        {"$set": {"status": "Active"}}
    )

    return {"message": "Updated User Status"}


@user_router.post("/login")
async def login_user(request: UserLoginRequest):
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if user["status"] != "Active":
        raise HTTPException(status_code=401, detail="Pending Account. Please Verify Your Email")


    try:
        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=400, detail="Invalid password")
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid password")
    
    user["_id"] = str(user["_id"])
    user["token"] = generate_token(str(user["_id"]), user["email"])
    
    return user
    
    # return {
    #     "name": user["name"],
    #     "email": user["email"],
    #     "token": generate_token(str(user["_id"]), user["email"]),
    #     "status": user["status"],
    # }

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

    # remove the departing user's email from the list
    tasks_collection.update_many(
        {"assigned_to": request.email},
        {"$pull": {"assigned_to": request.email}}
    )

    return {"message": "User deleted successfully"}


@user_router.put("/updateUser", status_code=status.HTTP_201_CREATED)
async def update_user(request : UpdateUserRequest):
    # Check if user exists
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {request.email} does not exist."
        )

    updated_fields = {}
    user_skills = user.get("skills", []) # Default to an empty list if "skills" is missing
    updated_fields["skills"] = list(set(user_skills))
    
    # Check if user wants to update their name
    if request.new_name:
        updated_fields["name"] = request.new_name

    # Check if user wants to add skills
    if request.add_skills:
        updated_fields["skills"] = list(set(user_skills + request.add_skills))
    
    # Check if user wants to remove skills
    if request.remove_skills:
        updated_fields["skills"] = list(set(updated_fields["skills"]) - set(request.remove_skills))

    # Update user
    updated_user = users_collection.find_one_and_update(
        {"email": request.email},
        {"$set": updated_fields},
        return_document=ReturnDocument.AFTER
    )

    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update user with email {request.email}"
        )

    updated_user["_id"] = str(updated_user["_id"])

    return {"message": "User updated successfully", "data": updated_user}


REGISTRATION_CONFIRMATION_EMAIL_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Registration - GroupGrade</title>
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
            margin-bottom: 20px;
        }}
        .content {{
            font-size: 16px;
            color: #555;
            margin-top: 10px;
            text-align: center;
        }}
        .button {{
            display: inline-block;
            padding: 12px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
            font-weight: bold;
        }}
        .button:hover {{
            background-color: #0056b3;
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
        <div class="header">Confirm Your Registration on GroupGrade</div>
        <div class="content">
            <p>Hi {user_name},</p>
            <p>Thank you for signing up for <strong>GroupGrade</strong>! Before you can start using your account, please confirm your email address by clicking the button below:</p>
            <a href="{confirmation_link}" class="button">Confirm Your Email</a>
            <p style="font-size: 14px; color: #777; margin-top: 20px;">
                If you did not create an account on GroupGrade, you can safely ignore this email.
            </p>
        </div>
        <div class="footer">
            Need help? Contact us at <a href="mailto:support@groupgrade.com" style="color: #007bff; text-decoration: none;">support@groupgrade.com</a>
            <br>© 2025 GroupGrade. All rights reserved.
        </div>
    </div>
</body>
</html>"""
