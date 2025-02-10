from db.models import User, Group, Task

def user_serial(user: User) -> dict:
    return {
        #"id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "groups": user["groups"]
    }

def group_serial(group: Group) -> dict:
    return {
        #"id": str(group["_id"]),
        "id": group["id"],
        "members": group["members"],
        "name": group["name"],
        "tasks": group["tasks"]
    }

def task_serial(task: Task) -> dict:
    return {
        #"id": str(task["_id"]),
        "id": task["id"],
        "assigned_to": task["assigned_to"],
        "name": task["name"],
        "description": task["description"],
        "due_date": task["due_date"],
        "status": task["status"],
        "group": task["group"],
        "priority": task["priority"]
    }

def users_serial(users: list[User]) -> list[dict]:
    return [user_serial(user) for user in users]

def groups_serial(groups: list[Group]) -> list[dict]:
    return [group_serial(group) for group in groups]

def tasks_serial(tasks: list[Task]) -> list[dict]:
    return [task_serial(task) for task in tasks]