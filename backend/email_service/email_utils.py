import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging
from logging import Logger
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from dotenv import load_dotenv, set_key
import json

API_NAME = os.getenv("GOOGLE_GMAIL_API_NAME")
API_VERSION = os.getenv("GOOGLE_GMAIL_API_VERSION")
SCOPES = [os.getenv("GOOGLE_GMAIL_SCOPES")]


load_dotenv()

def save_credentials_to_env(credentials):
    """Save OAuth credentials as a base64 string in .env file."""
    creds_bytes = pickle.dumps(credentials)
    creds_base64 = base64.b64encode(creds_bytes).decode("utf-8")

    # Save to .env
    set_key(".\.env", "GOOGLE_CREDENTIALS_BASE64", creds_base64)

def load_credentials_from_env():
    """Load OAuth credentials from .env."""
    creds_base64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
    if creds_base64:
        print("Google OAuth Credentials found.")
        creds_bytes = base64.b64decode(creds_base64)
        return pickle.loads(creds_bytes)
    print("Google OAuth Credentials not found.")
    return None

def get_google_client_secrets():
    """Retrieve Google OAuth client secrets from environment variables."""
    return {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "project_id": os.getenv("GOOGLE_PROJECT_ID"),
            "auth_uri": os.getenv("GOOGLE_AUTH_URI"),
            "token_uri": os.getenv("GOOGLE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.getenv("GOOGLE_AUTH_PROVIDER_X509_CERT_URL"),
            "redirect_uris": os.getenv("GOOGLE_REDIRECT_URIS").split(","),
        }
    }

def create_service(api_name, api_version, *scopes):
    print(api_name, api_version, scopes, sep='-')
    API_SERVICE_NAME = api_name
    API_VERSION = api_version
    SCOPES = [scope for scope in scopes[0]]
    print(f"scope {SCOPES}")

    cred = load_credentials_from_env()

    if not cred or not cred.valid:
        if cred and cred.expired and cred.refresh_token:
            print("Requesting a refresh token...")
            cred.refresh(Request())
            save_credentials_to_env(cred)
        else:
            print("Requesting a Google OAuth credential...")
            client_secrets = get_google_client_secrets()
            
            flow = InstalledAppFlow.from_client_config(client_secrets, SCOPES)

            cred = flow.run_local_server()

            save_credentials_to_env(cred)

    try:
        service = build(API_SERVICE_NAME, API_VERSION, credentials=cred)
        print(API_SERVICE_NAME, 'service created successfully')
        return service
    except Exception as e:
        print('Unable to connect.')
        print(e)
        return None


class EmailSender():
    def __init__(self):
        self.email_service = create_service(API_NAME, API_VERSION, SCOPES)

    def send_email(self, receipient : str, email_message:str=None, subject_line:str=None) -> bool:
        mimeMessage = MIMEMultipart()
        mimeMessage['to'] = receipient
        mimeMessage['subject'] = subject_line
        mimeMessage.attach(MIMEText(email_message, 'html'))
        raw_string = base64.urlsafe_b64encode(mimeMessage.as_bytes()).decode()

        message = self.email_service.users().messages().send(userId='me', body={'raw': raw_string}).execute()

        if not message:
            return False

        return True
    
email_sender : EmailSender = EmailSender()
