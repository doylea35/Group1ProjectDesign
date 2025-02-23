from db.models import User, Group, Task, SubTeam
from bson import ObjectId

def _user_serial(user: dict) -> User:
    return User(
        _id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        groups=[str(group_id) for group_id in user.get("groups", []) or []],  # Ensure it's a list
        free_time={
            day: [{"start": slot["start"], "end": slot["end"]} for slot in (slots or [])]
            for day, slots in (user.get("free_time", {}) or {}).items()  # Ensure it's a dict
        }
    )

    

def group_serial(group: dict) -> Group:
    print(f"inside group_serial: {str(group['_id'])}\n")

    return Group(  # Use the Group model instead of a plain dictionary
        _id=str(group["_id"]),  # Ensure _id is a string
        members=group["members"],
        name=group["name"],
        tasks=[str(task_id) for task_id in group.get("tasks", [])]  # Convert task IDs to strings
    )


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

def _subteam_serial(subteam: dict) -> SubTeam:
    return {
        "team_name": subteam["team_name"],
        "members": subteam["members"],
        "tasks": subteam["tasks"],
        "group": str(subteam["group"])
    }

def users_serial(users: list[dict]) -> list[User]:
    return [_user_serial(user) for user in users]

def groups_serial(groups: list[dict]) -> list[Group]:
    return [group_serial(group) for group in groups]

def tasks_serial(tasks: list[dict]) -> list[Task]:
    return [_task_serial(task) for task in tasks]

def subteams_serial(subteams: list[dict]) -> list[SubTeam]:
    return [_subteam_serial(subteam) for subteam in subteams]
