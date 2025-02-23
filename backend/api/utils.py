from email_validator import validate_email, EmailNotValidError
from fastapi import Depends, HTTPException
import jwt
from fastapi.security import OAuth2PasswordBearer
from db.database import users_collection
import os
from dotenv import load_dotenv
from db.schemas import _user_serial
from db.models import User
from bson import ObjectId
# Load environment variables
load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")


def is_valid_email(email: str) -> bool:
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False
    

# OAuth2 scheme for extracting Bearer token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Middleware function to authenticate users based on JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = users_collection.find_one({"email": str(payload["email"])})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
