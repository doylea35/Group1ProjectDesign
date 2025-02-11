from db.models import User, Group, Task
from bson import ObjectId

def _user_serial(user: dict) -> User:
    return {
        # "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "groups":[str(group_id) for group_id in user.get("groups", [])] 
    }

def _group_serial(group: dict) -> Group:
    return {
        # "id": str(group["_id"]),
        "members": group["members"],
        "name": group["name"],
        "tasks": [str(task_id) for task_id in group.get("tasks", [])]
    }

def _task_serial(task: dict) -> Task:
    return {
        # "id": str(task["_id"]),
        "assigned_to": task["assigned_to"],
        "name": task["name"],
        "description": task["description"],
        "due_date": task["due_date"],
        "status": task["status"],
        "group": str(task["group"]),
        "priority": task["priority"]
    }

def users_serial(users: list[dict]) -> list[User]:
    return [_user_serial(user) for user in users]

def groups_serial(groups: list[dict]) -> list[Group]:
    return [_group_serial(group) for group in groups]

def tasks_serial(tasks: list[dict]) -> list[Task]:
    return [_task_serial(task) for task in tasks]

