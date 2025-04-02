from bson import ObjectId
from api.utils import get_current_user
from fastapi import status
from fastapi.testclient import TestClient
from api.routes import group


def test_get_groups(test_client, monkeypatch):

    # simulate logged in user by overriding user dependancy
    dummy_user ={"email":"user@example.com"}
    
    test_client.app.dependency_overrides[get_current_user]= lambda: dummy_user

    # return dummy group from db and simulate a user in one group
    from db.database import users_collection, groups_collection
    dummy_user_db= {"email":"user@example.com", "groups": ["507f191e810c19729de860ea"]}
    monkeypatch.setattr(users_collection,"find_one", lambda query:dummy_user_db if query.get("email")=="user@example.com" else None)
    
    dummy_group ={
        "_id": ObjectId("507f191e810c19729de860ea"),
        "members": ["user@example.com"],
        "name": "Test Group",
        "tasks": []
    }


    monkeypatch.setattr(groups_collection, "find", lambda query: [dummy_group])
    
    response = test_client.get("/api/group/")
    assert response.status_code== 200

    json_data = response.json()
    assert "data" in json_data
    assert json_data["data"][0]["_id"] == "507f191e810c19729de860ea"
    assert json_data["data"][0]["name"] == "Test Group"

    assert "user@example.com" in json_data["data"][0]["members"]


    test_client.app.dependency_overrides.pop(get_current_user)
    
def test_create_group_handler(test_client, monkeypatch):
    """
    Test the POST /create endpoint.
    """
    # Override the database methods in the collections.
    from db.database import users_collection, groups_collection, chat_collection
    # Simulate that the creator exists.
    monkeypatch.setattr(users_collection, "find_one", 
        lambda query: {"email": "test@example.com", "groups": []} 
            if query.get("email") == "test@example.com" else None)
    # Simulate group insertion returning a fixed ObjectId.
    monkeypatch.setattr(groups_collection, "insert_one", 
        lambda doc: type("InsertResult", (), {"inserted_id": "507f191e810c19729de860ea"}))
    # Override the update that adds the group id to the user.
    monkeypatch.setattr(groups_collection, "find_one_and_update", 
        lambda query, update, return_document: {"email": "test@example.com", "groups": ["507f191e810c19729de860ea"]})
    # Override chat insertion.
    monkeypatch.setattr(chat_collection, "insert_one", lambda doc: doc)
    # Optionally, if your endpoint sends an invitation email, override that function:
    monkeypatch.setattr(group, "send_project_invitation_email", lambda members, creator_email, group_id, group_name: None)

    payload = {
        "creator_email": "test@example.com",
        "group_name": "Test Group",
        "members": ["new@example.com"]
    }
    response = test_client.post("/api/group/create", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    json_data = response.json()
    # Check that the returned group data is as expected.
    assert "data" in json_data
    assert json_data["data"]["name"] == "Test Group"
    assert json_data["data"]["_id"] == "507f191e810c19729de860ea"
    assert json_data["message"] == "Group created successfully"
