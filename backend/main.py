import sys
import os
from unittest.mock import MagicMock

# Mock Google OAuth when running pytest because of Google OAuth error
if "pytest" in sys.modules:
    sys.modules["email_service.email_utils"] = MagicMock()


from fastapi import FastAPI
from api.routes.greeting import greeting_router
from api.routes.profiles import profiles_router
from api.routes.group import group_router
from api.routes.calendar import calendar_router
from api.routes.user import user_router
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv
import uvicorn

load_dotenv()


# Create logger
logger = logging.getLogger("fastapi_app")
logger.setLevel(logging.DEBUG)

# Create handler (console output)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Define log format
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(console_handler)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to our frontend URL (in a later stage) for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# https://group-grade-backend-5f919d63857a.herokuapp.com/api/calendar/getUserFreeTime
# routers
app.include_router(greeting_router, prefix="", tags=["greeting"])
app.include_router(profiles_router, prefix="", tags=["profiles"])
app.include_router(group_router, prefix="/api/group", tags=["Group"])
app.include_router(calendar_router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(user_router, prefix="/api/user", tags=["User"])

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)