from dotenv import load_dotenv
import os
load_dotenv()
env = os.getenv("ENV")
frontend_url = os.getenv("FRONTEND_URL_PROD")

if env == "DEV":
    frontend_url = os.getenv("FRONTEND_URL_DEV")