import pickle
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from datetime import datetime
from dotenv import load_dotenv, set_key
import json
import base64

load_dotenv()

def save_credentials_to_env(credentials):
    """Save OAuth credentials as a base64 string in .env file."""
    print("save_credentials_to_env() called\n")
    creds_bytes = pickle.dumps(credentials)
    creds_base64 = base64.b64encode(creds_bytes).decode("utf-8")

    # Save to .env
    set_key(".env", "GOOGLE_CREDENTIALS_BASE64", creds_base64)

def load_credentials_from_env():
    """Load OAuth credentials from .env."""
    print("load_credentials_from_env()\n")
    creds_base64 = os.getenv("GOOGLE_CREDENTIALS_BASE64")
    print(f"\n\ncreds_base64: {creds_base64}\n\n")
    if creds_base64:
        creds_bytes = base64.b64decode(creds_base64)
        return pickle.loads(creds_bytes)
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
            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URIS").split(",")],
        }
    }

def create_service(api_name, api_version, *scopes):
    print(api_name, api_version, scopes, sep='-')
    # CLIENT_SECRET_FILE = client_secret_file
    API_SERVICE_NAME = api_name
    API_VERSION = api_version
    SCOPES = [scope for scope in scopes[0]]
    print(f"scope {SCOPES}")

    cred = load_credentials_from_env()

    if not cred or not cred.valid:
        if cred and cred.expired and cred.refresh_token:
            cred.refresh(Request())
            save_credentials_to_env(cred)
        else:
            # Load client secrets from environment variables
            client_secrets = get_google_client_secrets()
            with open("temp_client_secrets.json", "w") as f:
                json.dump(client_secrets, f)

            flow = InstalledAppFlow.from_client_secrets_file("temp_client_secrets.json", SCOPES)
            cred = flow.run_local_server()

            # remove temporary file
            os.remove("temp_client_secrets.json")

        # with open(pickle_file, 'wb') as token:
        #     pickle.dump(cred, token)
            save_credentials_to_env(cred)

    try:
        service = build(API_SERVICE_NAME, API_VERSION, credentials=cred)
        print(API_SERVICE_NAME, 'service created successfully')
        return service
    except Exception as e:
        print('Unable to connect.')
        print(e)
        return None
