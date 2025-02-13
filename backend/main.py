from fastapi import FastAPI
from api.routes.greeting import greeting_router
from api.routes.profiles import profiles_router
from api.routes.group import group_router
import logging


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


# routers
app.include_router(greeting_router, prefix="", tags=["greeting"])
app.include_router(profiles_router, prefix="", tags=["profiles"])
app.include_router(group_router, prefix="/api/group", tags=["Group"])