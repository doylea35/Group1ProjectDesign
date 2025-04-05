from fastapi import APIRouter, HTTPException, Query,  Depends, status, Body, File, UploadFile
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
    return {
        "name": user["name"],
        "email": user["email"],
        "token": generate_token(str(user["_id"]), user["email"]),
        "status": user["status"],
    }

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


import datetime
import pdfplumber
from db.database import files_collection
import boto3
from botocore.exceptions import NoCredentialsError
import openai

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

# Load API Key from environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")

def extract_text_from_pdf(file_path):
    """Extracts text from a PDF file"""
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text.strip()

@user_router.post("/uploadCV", summary="Upload a CV for a user")
async def upload_cv(
    file: UploadFile = File(...),
    # current_user: dict = Depends(get_current_user) # comment this line if you want to test locally without previouslly signing-in
):
    """Upload a CV for a user and extract text from it"""
    current_user = {"email": "ainagool@gmail.com"} # uncomment this line if you want to test locally without previouslly signing-in

    # Get the user's name
    user_name = current_user.get("name", "user").replace(" ", "_")  # Replace spaces just in case

    # Create a clean filename like "john_doe_cv.pdf"
    new_filename = f"{user_name}_cv.pdf"

    # check if user exists
    if not users_collection.find_one({"email": current_user["email"]}):
        raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email {current_user['email']} does not exist."
            )

    # get file +  check file is pdf
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
    # upload the file to S3
    try:
        s3_client.upload_fileobj(file.file, AWS_BUCKET_NAME, new_filename)
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    # construct public url of the uploaded file
    file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{new_filename}"

    # store file metadata in MongoDB (using "files" collection)
    file_metadata = {
        "filename": new_filename,
        "file_url": file_url,
        "user_email": current_user["email"],
        "uploaded_by": current_user["email"],
        "upload_date": datetime.datetime.utcnow()
    }
    files_collection.insert_one(file_metadata)

    return {"message": "CV uploaded successfully", "filename": new_filename}


@user_router.post("/getCVSkills")
async def ask_chatgpt_for_cv_skills(current_user: dict = Depends(get_current_user)):
     # get user cv file
     user_cv_file = files_collection.find_one({"user_email": current_user["email"]})
     if not user_cv_file:
         raise HTTPException(status_code=400, detail="CV file not found")
     
     # extract text from cv
     user_cv_text = extract_text_from_pdf(user_cv_file["file_url"])
     
     # Prepare the final prompt
     formatted_prompt = CV_SKILLS_PROMPT_TEMPLATE.format(user_cv_text=str(user_cv_text))

     # Call OpenAI API
     response = openai.ChatCompletion.create(
         model="gpt-4o",  # Use "gpt-4o" for best performance
         messages=[{"role": "user", "content": formatted_prompt}],
         max_tokens=1000,  # Limit response length
     )
     # Extract the skills from the response
     gpt_response = response["choices"][0]["message"]["content"]

     # Parse the skills from the response
     skills = {}
     for line in gpt_response.split("\n"):
         if line.startswith("-"):
             category, skill_list = line[1:].split(":")
             skills[category.strip()] = [skill.strip() for skill in skill_list.split(",")]
 
     return skills

CV_SKILLS_PROMPT_TEMPLATE = """
 You are given a text extracted from a pdf file containing a CV. Your task is to extract the skills from the CV.
 Now, given the following text, extract the skills from the CV (if any).

 This is the text extracted from the CV:
 {cv_text}
 
 The skills to extract are:
- Studies or position: name of their degree or work position that they have had
 - Areas of expertise: multiple answer
- Previous work experience: yes or no
- Previous voluntary work / fundation work / unpayed work : yes or no
- Communication skills: examples of communication skills found in the cv
- Team work skills: examples of team work skills found in the cv
- Other skills that might help someone be introduced as a grouppartner
- Brief self presentation: if there's a presentation in the cv, provide a reduced presentation written in 1st person about the person introducing themselves to potential teammates
 
 The output expected is a dictionary containing the extracted skills.
 ### **Example Output 1:**
 {{
    "studies_or_position": "Master's degree in Computer Science", 
    "areas_of_expertise": ["Software Engineering", "Cloud Computing", "Data Analytics", "Cybersecurity"], 
    "previous_work_experience": "yes", 
    "previous_voluntary_work": "no", 
    "communication_skills": ["Led cross-functional team meetings", "Created technical documentation for clients"], 
    "team_work_skills": ["Collaborated with developers and designers on software projects", "Coordinated with marketing team for product launch"], 
    "other_skills": ["Fluent in Spanish and French", "Experienced with cloud platforms like AWS and Azure", "Strong problem-solving skills"], 
    "brief_self_presentation": "I am a Computer Science graduate with a passion for software development and cloud computing. I enjoy solving complex problems and thrive in collaborative team environments." 
 }}
 
 ### **Example Output 2:**
{{ 
    "studies_or_position": "Bachelor's degree in Business Administration", 
    "areas_of_expertise": ["Marketing", "Business Strategy", "Data Analysis", "Leadership"], 
    "previous_work_experience": "yes", 
    "previous_voluntary_work": "yes", 
    "communication_skills": ["Presented marketing strategies to senior management", "Wrote monthly performance reports for clients"], 
    "team_work_skills": ["Managed a team of interns for market research", "Collaborated with product managers to improve customer engagement"], 
    "other_skills": ["Proficient in Microsoft Excel and PowerPoint", "Experience with Google Analytics and SEM tools", "Strong interpersonal skills"], 
    "brief_self_presentation": "I'm a Business Administration graduate with a focus on marketing and data analysis. I enjoy working in teams to develop innovative strategies that drive growth." 
}}
 
 ### **Example Output 3:**
 {{
    "studies_or_position": "High School Student", 
    "areas_of_expertise": ["Mathematics", "Physics", "Computer Science", "Leadership"], 
    "previous_work_experience": "no", 
    "previous_voluntary_work": "yes", 
    "communication_skills": ["Presented school projects in front of classmates", "Participated in science fairs and explained research to judges"], 
    "team_work_skills": ["Worked in group projects to solve scientific problems", "Collaborated with peers on organizing school events"], 
    "other_skills": ["Proficient in Microsoft Office", "Basic programming skills in Python", "Experience with online learning platforms"], 
    "brief_self_presentation": "I am a high school student with a passion for mathematics, physics, and computer science. I enjoy working with my peers on collaborative projects and am always eager to learn new things." 
 }}


 ### **Example Output 4:**
 {{}}
 
 Return the response strictly in JSON format like the example above and containing only these categories of skills, with no additional text, explanations or new sets of skills. If no skills exist, return an empty JSON object {{}} with out ```json ```. so pure text only. Please follow the output format strictly. I don't want you to output any extra text in the response other than either a dictionary containing the skillsets explained or an empty dictionary {{}} when there are no skills. 
 """