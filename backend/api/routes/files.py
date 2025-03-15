import os
import datetime
import boto3
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv
from bson import ObjectId
from db.database import db, groups_collection 
from api.utils import get_current_user

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

files_router = APIRouter()


@files_router.get("/files/{filename}")
async def get_presigned_url(filename: str):
    try:

        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": AWS_BUCKET_NAME, "Key": filename},
            ExpiresIn=3600  # url expires in 1 hour
        )
        return {"presigned_url": presigned_url}
    
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))


#Upload a file to AWS S3 and store its metadata in MongoDB.
#Only allow uploads if the current user is a member of the group.
@files_router.post("/upload", summary="Upload a file for a group")
async def upload_file(
    file: UploadFile = File(...),
    group_id: str = Query(..., description="ID of the group"),
    current_user: dict = Depends(get_current_user)
):
    
    # see if the group exists
    group = groups_collection.find_one({"_id": ObjectId(group_id)})
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # check if current user is a member of this group
    if current_user["email"] not in group["members"]:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    # upload the file to S3
    try:
        s3_client.upload_fileobj(file.file, AWS_BUCKET_NAME, file.filename)
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    # construct public url of the uploaded file
    file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file.filename}"
    
    # store file metadata in MongoDB (using "files" collection)
    files_collection = db["files"]
    file_metadata = {
        "filename": file.filename,
        "file_url": file_url,
        "group_id": group_id,
        "uploaded_by": current_user["email"],
        "upload_date": datetime.datetime.utcnow()
    }
    files_collection.insert_one(file_metadata)
    
    return {"message": "File uploaded successfully", "file_url": file_url}


