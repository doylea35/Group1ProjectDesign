from db.models import User, Group, Task, SubTeam, Notification


def _user_serial(user: dict) -> User:
    free_time = {}
    for day, slots in (user.get("free_time", {}).get("free_time", {}) or {}).items():
        valid_slots = []
        for slot in (slots or []):
            try:
                valid_slots.append({"start": slot["start"], "end": slot["end"]})
            except (TypeError, KeyError) as e:
                pass
        free_time[day] = valid_slots
    return User(
        _id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        groups=[str(group_id) for group_id in user.get("groups", []) or []],  # Ensure it's a list
        skills=[str(skill) for skill in user.get("skills", []) or []],  # Ensure it's a list
        free_time=free_time,
        password=None,
        token= None,
        status=None,
        confirmation_code=None
    )

    

def group_serial(group: dict) -> Group:
    print(f"inside group_serial: {str(group['_id'])}\n")
    
    if "member_names" in group:
        
        processed_member_names = {key.replace('[dot]', '.'): value for key, value in group["member_names"].items()}
        
        return Group(  # Use the Group model instead of a plain dictionary
            _id=str(group["_id"]),  # Ensure _id is a string
            members=group["members"],
            name=group["name"],
            tasks=[str(task_id) for task_id in group.get("tasks", [])],  #  Convert task IDs to strings
            pending_members=group["pending_members"],
            member_names=processed_member_names
        )
    else:
        return Group(  # Use the Group model instead of a plain dictionary
            _id=str(group["_id"]),  # Ensure _id is a string
            members=group["members"],
            name=group["name"],
            tasks=[str(task_id) for task_id in group.get("tasks", [])],  #  Convert task IDs to strings
            pending_members=group["pending_members"]
        )


def _task_serial(task: dict) -> Task:
    return {
        "id": str(task["_id"]),
        "assigned_to": task["assigned_to"],
        "name": task["name"],
        "description": task["description"],
        "due_date": task["due_date"],
        "status": task["status"],
        "group": str(task["group"]),
        "priority": task["priority"],    
        "labels": task.get("labels", []), 
        "comments": task.get("comments", [])  
    }

def _subteam_serial(subteam: dict) -> SubTeam:
    return {
        "team_name": subteam["team_name"],
        "members": subteam["members"],
        "tasks": subteam["tasks"],
        "group": str(subteam["group"])
    }

def _notification_serial(notification: dict) -> Notification:
    return Notification(
        _id=str(notification["_id"]),
        user=notification["user"],
        task_id=str(notification["task_id"]),
        group_id=str(notification["group_id"]),
        notification_type=notification["notification_type"],
        message=notification["message"],
        timestamp=notification["timestamp"],
        read=notification["read"]
    )


def users_serial(users: list[dict]) -> list[User]:
    return [_user_serial(user) for user in users]

def groups_serial(groups: list[dict]) -> list[Group]:
    return [group_serial(group) for group in groups]

def tasks_serial(tasks: list[dict]) -> list[Task]:
    return [_task_serial(task) for task in tasks]

def subteams_serial(subteams: list[dict]) -> list[SubTeam]:
    return [_subteam_serial(subteam) for subteam in subteams]

def notifications_serial(notifications: list[dict]) -> list[Notification]:
    return [_notification_serial(notification) for notification in notifications]
