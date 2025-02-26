from api.utils import get_current_user

def test_get_user_freetime(test_client, monkeypatch):
    # simulate user logged in
    dummy_user = {"email": "user@example.com"}
    test_client.app.dependency_overrides[get_current_user]=lambda: dummy_user

    import api.utils
    monkeypatch.setattr("api.routes.calendar.is_valid_email",lambda _: True)


    # fake user db query
    dummy_user_db= {
        "email": "user@example.com",
        "free_time": {
            "Monday": [{"start": "09:00", "end": "10:30"}],
            "Wednesday": [{"start": "15:00", "end": "16:00"}]
        }
    }
    from db.database import users_collection
    monkeypatch.setattr(users_collection, "find_one", lambda query: dummy_user_db if query.get("email") =="user@example.com" else None)

    #api request
    response=test_client.get("/api/calendar/getUserFreeTime")

    # just to see why it keeps failing
    if response.status_code != 200:
        print("Response JSON:", response.json())  

    # check response
    assert response.status_code==200
    json_data =response.json()
    assert "data" in json_data
    assert json_data["data"] == {
        "Monday": [{"start": "09:00", "end": "10:30"}],
        "Wednesday": [{"start": "15:00", "end": "16:00"}]
    }

    
    test_client.app.dependency_overrides.pop(get_current_user)
