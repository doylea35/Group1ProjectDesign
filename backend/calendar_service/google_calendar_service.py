import base64
import os
import pickle
import datetime
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from dotenv import load_dotenv, set_key

load_dotenv()

# Calendar API details (you can override these via .env)
API_NAME = os.getenv("GOOGLE_CALENDAR_API_NAME", "calendar")
API_VERSION = os.getenv("GOOGLE_CALENDAR_API_VERSION", "v3")
SCOPES = [os.getenv("GOOGLE_CALENDAR_SCOPES", "https://www.googleapis.com/auth/calendar")]

def save_credentials_to_env(credentials):
    """Save OAuth credentials as a base64 string in .env file."""
    creds_bytes = pickle.dumps(credentials)
    creds_base64 = base64.b64encode(creds_bytes).decode("utf-8")
    print(f"creds_base64: {creds_base64}\n")
    set_key(".env", "GOOGLE_CALENDAR_CREDENTIALS_BASE64", creds_base64)

def load_credentials_from_env():
    """Load OAuth credentials from .env."""
    creds_base64 = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_BASE64")
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
        print("No valid Google OAuth Credentials...")
        if cred and cred.expired and cred.refresh_token:
            print("Requesting a refresh token...")
            try:
                cred.refresh(Request())
                save_credentials_to_env(cred)
            except Exception as e:
                print("Error occurred when refreshing token:", e)
                print("Requesting a new Google OAuth credential...")
                client_secrets = get_google_client_secrets()
                flow = InstalledAppFlow.from_client_config(client_secrets, SCOPES)
                cred = flow.run_local_server(access_type="offline", prompt="consent")
                save_credentials_to_env(cred)
        else:
            print("Requesting a new Google OAuth credential...")
            client_secrets = get_google_client_secrets()
            flow = InstalledAppFlow.from_client_config(client_secrets, SCOPES)
            cred = flow.run_local_server(access_type="offline", prompt="consent")
            save_credentials_to_env(cred)

    try:
        service = build(API_SERVICE_NAME, API_VERSION, credentials=cred)
        print(API_SERVICE_NAME, 'service created successfully')
        return service
    except Exception as e:
        print('Unable to connect.')
        print(e)
        return None

class GoogleCalendarService:
    def __init__(self):
        self.calendar_service = create_service(API_NAME, API_VERSION, SCOPES)

    def create_event(self, summary: str, description: str, start_datetime: datetime.datetime,
                     end_datetime: datetime.datetime, attendees: list = []):
        event = {
            "summary": summary,
            "description": description,
            "start": {
                "dateTime": start_datetime.isoformat(),
                "timeZone": "UTC"  # Adjust to your local timezone if needed
            },
            "end": {
                "dateTime": end_datetime.isoformat(),
                "timeZone": "UTC"
            },
            "attendees": [{"email": email} for email in attendees],
            "reminders": {"useDefault": True},
        }

        try:
            event_result = self.calendar_service.events().insert(
                calendarId="primary",
                body=event,
                sendUpdates="all"  # Sends invitations to attendees
            ).execute()
            print("Event created successfully:", event_result.get("htmlLink"))
            return event_result
        except Exception as e:
            print("Error creating event:", e)
            return None
