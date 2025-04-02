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
    Test the POST /create endpoint and verify that a chat is created.
    """
    from fastapi import status
    from db.database import users_collection, groups_collection, chat_collection

    # Simulate that the creator exists.
    monkeypatch.setattr(
        users_collection,
        "find_one",
        lambda query: {"email": "test@example.com", "groups": []}
        if query.get("email") == "test@example.com"
        else None,
    )

    # Simulate group insertion returning a fixed ObjectId.
    monkeypatch.setattr(
        groups_collection,
        "insert_one",
        lambda doc: type("InsertResult", (), {"inserted_id": "507f191e810c19729de860ea"}),
    )

    # Override the update that adds the group id to the user.
    monkeypatch.setattr(
        groups_collection,
        "find_one_and_update",
        lambda query, update, return_document: {"email": "test@example.com", "groups": ["507f191e810c19729de860ea"]},
    )

    # Prepare a container to capture the chat document inserted.
    captured_chat = {}

    def fake_chat_insert_one(doc):
        captured_chat.update(doc)
        return doc

    monkeypatch.setattr(chat_collection, "insert_one", fake_chat_insert_one)

    # Override the invitation email function.
    # Adjust the module path if your send_project_invitation_email is defined elsewhere.
    monkeypatch.setattr(group, "send_project_invitation_email", lambda members, creator_email, group_id, group_name: None)

    payload = {
        "creator_email": "test@example.com",
        "group_name": "Test Group",
        "members": ["new@example.com"],
    }
    response = test_client.post("/api/group/create", json=payload)
    assert response.status_code == status.HTTP_201_CREATED

    json_data = response.json()
    # Check that the returned group data is as expected.
    assert "data" in json_data
    assert json_data["data"]["name"] == "Test Group"
    assert json_data["data"]["_id"] == "507f191e810c19729de860ea"
    assert json_data["message"] == "Group created successfully"

    # Now verify that a chat was created.
    # Expected chat document structure:
    # {
    #   "is_groupchat": True,
    #   "participants": ["test@example.com"],
    #   "chat_history": [],
    #   "group_id": "507f191e810c19729de860ea"
    # }
    assert captured_chat.get("is_groupchat") is True
    assert captured_chat.get("participants") == ["test@example.com"]
    assert captured_chat.get("chat_history") == []
    assert captured_chat.get("group_id") == "507f191e810c19729de860ea"

# Test when membership confirmation is successful.
def test_confirm_member_success(test_client, monkeypatch):
    group_id = "507f191e810c19729de860ea"
    # Dummy group: "new@example.com" is pending.
    dummy_group = {
        "_id": ObjectId(group_id),
        "members": ["existing@example.com"],
        "pending_members": ["new@example.com"],
        "name": "Test Group",
    }
    # Dummy user: not yet in the group. Note the inclusion of an "_id" field.
    dummy_user = {
        "_id": "dummy_user_id",
        "email": "new@example.com",
        "groups": []
    }
    from db.database import groups_collection, users_collection, chat_collection

    # Override groups_collection.find_one to return the dummy group.
    monkeypatch.setattr(
        groups_collection,
        "find_one",
        lambda query: dummy_group if query.get("_id") == ObjectId(group_id) else None
    )
    # Override users_collection.find_one to return the dummy user.
    monkeypatch.setattr(
        users_collection,
        "find_one",
        lambda query: dummy_user if query.get("email") == "new@example.com" else None
    )
    # Simulate updating the group: add the user to members and remove from pending_members.
    def fake_group_update(query, update, return_document):
        if "new@example.com" not in dummy_group["members"]:
            dummy_group["members"].append("new@example.com")
        if "new@example.com" in dummy_group["pending_members"]:
            dummy_group["pending_members"].remove("new@example.com")
        return dummy_group
    monkeypatch.setattr(groups_collection, "find_one_and_update", fake_group_update)
    # Simulate updating the user: add the group id.
    monkeypatch.setattr(
        users_collection,
        "find_one_and_update",
        lambda query, update, return_document: {**dummy_user, "groups": dummy_user["groups"] + [group_id], "_id": dummy_user["_id"]}
    )
    # Simulate updating the chat (can be a no-op or return a dummy updated chat).
    monkeypatch.setattr(
        chat_collection,
        "find_one_and_update",
        lambda query, update: {"group_id": group_id, "participants": ["existing@example.com", "new@example.com"]}
    )
    
    response = test_client.get(f"/api/group/confirmMembership/new@example.com/{group_id}")
    assert response.status_code == status.HTTP_200_OK
    json_data = response.json()
    assert "User is now added to the group." in json_data["message"]
    assert "updated_group" in json_data["data"]
    assert "updated_user" in json_data["data"]

# Test when the user is not found.
def test_confirm_member_user_not_found(test_client, monkeypatch):
    group_id = "507f191e810c19729de860ea"
    dummy_group = {
        "_id": ObjectId(group_id),
        "members": ["existing@example.com"],
        "pending_members": ["new@example.com"],
        "name": "Test Group",
    }
    from db.database import groups_collection, users_collection
    monkeypatch.setattr(
        groups_collection,
        "find_one",
        lambda query: dummy_group if query.get("_id") == ObjectId(group_id) else None
    )
    # Simulate that the user is not found.
    monkeypatch.setattr(users_collection, "find_one", lambda query: None)
    
    response = test_client.get(f"/api/group/confirmMembership/unknown@example.com/{group_id}")
    print(f"\nResponse: {response.json()}\n")
    # Expecting a 400 error.
    json_data = response.json()
    assert json_data["status_code"] == status.HTTP_400_BAD_REQUEST
    
    assert "is not a registered user" in json_data["detail"]["message"]

