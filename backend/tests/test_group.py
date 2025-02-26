from bson import ObjectId
from api.utils import get_current_user

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