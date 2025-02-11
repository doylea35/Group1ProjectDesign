from fastapi import FastAPI
from api.routes.greeting import greeting_router
from api.routes.profiles import profiles_router
from api.routes.group import group_router


app = FastAPI()


# routers
app.include_router(greeting_router, prefix="", tags=["greeting"])
app.include_router(profiles_router, prefix="", tags=["profiles"])
app.include_router(group_router, prefix="/api/group", tags=["Group"])