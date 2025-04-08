from fastapi import APIRouter, HTTPException, status
from db.database import groups_collection, users_collection, tasks_collection, subteams_collection
from db.models import SubTeam, Task
from db.schemas import subteams_serial, tasks_serial
from api.request_model.subteam_request_schema import CreateSubteamRequest, DeleteSubteamRequest, AssignTaskToSubteamRequest, RemoveTaskFromSubteamRequest, GetSubteamsByGroupRequest, GetTasksBySubteamRequest
from bson import ObjectId

subteam_router = APIRouter()

#### GET Requests ####
@subteam_router.get("/")
async def get_subteams():
    subteams = subteams_serial(subteams_collection.find())
    #return {"data":subteams}
    return subteams


    # get subteams within a project
@subteam_router.get("/getSubteamsByGroup")
async def get_subteams_by_group(request: GetSubteamsByGroupRequest):
    group_id = request.group_id
    # Validate group ID
    if not groups_collection.find_one({"_id": ObjectId(group_id)}):
        raise HTTPException(status_code=400, detail=f"Group {group_id} does not exist")
    
    subteams = subteams_serial(subteams_collection.find({"group": ObjectId(group_id)}))
    return {"data": {"group": group_id, "subteams": subteams}}


    # get all task for a subteam
@subteam_router.get("/getTasksBySubteam")
async def get_tasks_by_subteam(request: GetTasksBySubteamRequest):
    subteam_id = request.subteam_id   
    subteam = subteams_collection.find_one({"_id": ObjectId(subteam_id)})
    # Check if subteam exists
    if not subteam:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subteam with id {subteam_id} does not exist."
            )
    tasks = []
    for task_id in subteam["tasks"]:
        task = tasks_collection.find_one({"_id": ObjectId(task_id)})
        tasks.append(task)
    tasks = tasks_serial(tasks)
    return {"data": {"subteam": subteam_id, "tasks": tasks}}

#### POST Requests ####
@subteam_router.post("/createSubteam", status_code=status.HTTP_201_CREATED)
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
    inserted_subteam = subteams_collection.insert_one(newSubTeam)
    # created_subteam = subteams_collection.find_one({"team_name": request.team_name})
    newSubTeam["_id"] = str(inserted_subteam.inserted_id)
    newSubTeam["group"] = str(newSubTeam["group"])

    # add subteam id to the groups' "subteams" field
    # groups_collection.find_one_and_update(
    #     {"_id": request.group}, # find by group id
    #     {"$addToSet": {"subteams": inserted_subteam.inserted_id}}, 
    #     return_document=True)
    
    return {"message": "Subteam created successfully", "data":newSubTeam}

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

    return {"message": "Deletion was successful"}



#### PUT Requests ####
@subteam_router.put("/assignTaskToSubteam", status_code=status.HTTP_201_CREATED)
async def assign_task_to_subteam(request: AssignTaskToSubteamRequest):
    subteam_id = request.subteam_id
    # Check if subteam exists
    if not subteams_collection.find_one({"_id": ObjectId(subteam_id)}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subteam with id {subteam_id} does not exist."
            )
    
    subteam = subteams_collection.find_one({"_id": ObjectId(subteam_id)})
    
    # Check if task exists
    if not tasks_collection.find_one({"_id": ObjectId(request.task_id)}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task with ID {request.task_id} does not exist."
            )
    
    # Update subteam
    subteams_collection.update_one(
        {"_id": ObjectId(request.subteam_id)},
        {"$push": {"tasks": request.task_id}}
    )

    # Update task
    tasks_collection.update_one(
        {"_id": ObjectId(request.task_id)},
        {"$set": {"subteam": request.subteam_id}}
    )

    return {"message": "Task assigned to subteam successfully.", "data": {"subteam": request.subteam_id, "task": request.task_id}}


@subteam_router.put("/removeTaskFromSubteam", status_code=status.HTTP_201_CREATED)
async def remove_task_from_subteam(request: RemoveTaskFromSubteamRequest):
    # Check if subteam exists
    if not subteams_collection.find_one({"team_name": request.team_name}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subteam with team name {request.team_name} does not exist."
            )
    
    # Check if task exists
    if not tasks_collection.find_one({"_id": ObjectId(request.task)}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task with ID {request.task} does not exist."
            )
    
    # Update subteam
    subteams_collection.update_one(
        {"team_name": request.team_name},
        {"$pull": {"tasks": request.task}}
    )

    # Update task
    tasks_collection.update_one(
        {"_id": ObjectId(request.task)},
        {"$unset": {"subteam": request.team_name}}
    )

    return {"message": "Task removed from subteam successfully"}