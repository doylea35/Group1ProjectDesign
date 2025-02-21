from fastapi import APIRouter, HTTPException, status
from db.database import groups_collection, users_collection, tasks_collection, subteams_collection
from db.models import SubTeam, Task
from db.schemas import subteams_serial, tasks_serial
from api.request_model.subteam_request_schema import CreateSubteamRequest, DeleteSubteamRequest
from bson import ObjectId

subteam_router = APIRouter()

#### GET Requests ####
@subteam_router.get("/", response_model=list[SubTeam])
async def get_subteams():
    subteams = subteams_serial(subteams_collection.find())
    return subteams

    # get subteams within a project
@subteam_router.get("/getSubteamsByGroup/{group_id}", response_model=list[SubTeam])
async def get_subteams_by_group(group_id: str):
    # Validate group ID
    if not groups_collection.find_one({"_id": ObjectId(group_id)}):
        raise HTTPException(status_code=400, detail=f"Group {group_id} does not exist")
    
    subteams = subteams_serial(subteams_collection.find({"group": ObjectId(group_id)}))
    return subteams

    # get all task for a subteam
@subteam_router.get("/getTasksBySubteam/{team_name}", response_model=list[Task])
async def get_tasks_by_subteam(team_name: str):
    # Check if subteam exists
    if not subteams_collection.find_one({"team_name": team_name}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subteam with team name {team_name} does not exist."
            )
    
    subteam = subteams_collection.find_one({"team_name": team_name})
    tasks = []
    for task_id in subteam["tasks"]:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
        tasks.append(task)
    tasks = tasks_serial(tasks)
    return tasks

#### POST Requests ####
@subteam_router.post("/createSubteam", response_model=SubTeam, status_code=status.HTTP_201_CREATED)
async def create_subteam(request : CreateSubteamRequest):
    # Check if team_name already exists
    if subteams_collection.find_one({"team_name": request.team_name}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Team {request.team_name} already exists"
            )
    
    # Validate group ID
    if not groups_collection.find_one({"_id": ObjectId(request.group)}):
        raise HTTPException(status_code=400, detail=f"Group {request.group} does not exist")
    
    # Validate member IDs
    valid_member_ids = []
    for member_id in request.members:
        if not users_collection.find_one({"email": member_id}):
            raise HTTPException(status_code=400, detail=f"User {member_id} does not exist")
        valid_member_ids.append(member_id)

    # Validate task IDs
    valid_task_ids = []
    if request.tasks:
        for task_id in request.tasks:
            if not tasks_collection.find_one({"_id": ObjectId(task_id)}):
                raise HTTPException(status_code=400, detail=f"Task {task_id} does not exist")
            valid_task_ids.append(task_id)

    # Create a new subteam object
    newSubTeam = {
        "team_name": request.team_name,
        "members": valid_member_ids,
        "group": ObjectId(request.group),
        "tasks": valid_task_ids
    }

    # Insert subteam
    subteams_collection.insert_one(newSubTeam)
    created_subteam = subteams_collection.find_one({"team_name": request.team_name})

    # add subteam id to the groups' "subteams" field
    updated_group = groups_collection.find_one_and_update(
        {"_id": ObjectId(request.group)}, # find by group id
        {"$addToSet": {"subteams": str(created_subteam["_id"])}}
        , return_document=True)
    


    return created_subteam

#### DELETE Requests ####
@subteam_router.delete("/deleteSubteam",  status_code=status.HTTP_201_CREATED)
async def delete_subteam(request : DeleteSubteamRequest):
    # Check if subteam exists
    if not subteams_collection.find_one({"team_name": request.team_name}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subteam with team name {request.team_name} does not exist."
            )
    
    # Check if member exists
    if not users_collection.find_one({"email": request.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email {request.email} does not exist."
            )
    
    # delete subteam from user
    users_collection.update_many(
        {},
        {"$pull": {"subteams": request.team_name}}
    )

    # Delete subteam
    subteams_collection.delete_one({"team_name": request.team_name})


