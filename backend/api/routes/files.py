import os
import boto3
from fastapi import APIRouter, File, UploadFile, HTTPException
from botocore.exceptions import NoCredentialsError
from dotenv import load_dotenv

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


@files_router.get("/file/{filename}")
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



@files_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    uploads a file to AWS S3 and returns the file's public URL
    """
    try:

        # upload file
        s3_client.upload_fileobj(file.file, AWS_BUCKET_NAME, file.filename)

        # construct the file url
        file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file.filename}"
        return {"message": "File uploaded successfully", "file_url": file_url}
    
    except NoCredentialsError:
        raise HTTPException(status_code=500, detail="AWS credentials not found")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


