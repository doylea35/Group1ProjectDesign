# def test_get_subteams(test_client, monkeypatch):
#     #  fake subteams data (includes _id, but our serializer will remove it)
#     fake_subteams = [{
#         "_id": "dummy_id",
#         "team_name": "Test Team",
#         "members": ["user1@example.com"],
#         "group": "dummy_group_id",
#         "tasks": []
#     }]

#     #  include the router in the test since not in main.py
#     from api.routes.subteams import subteam_router
    
#     test_client.app.include_router(subteam_router, prefix ="/api/subteams", tags= ["Subteams"]) # fix this when subteam router is registered in main

#     # patch subteams_collection.find to return the fake data
#     from db.database import subteams_collection
#     monkeypatch.setattr(subteams_collection, "find", lambda: fake_subteams)

#     # mke the API request to the get / endpoint of subteam router
#     response = test_client.get("/api/subteams/")
#     # verify response.
#     assert response.status_code== 200
#     json_data = response.json()
    
#     # make an expected value by removing the '_id' field from fake_subteams
#     expected= [{k: v for k, v in team.items() if k !="_id"} for team in fake_subteams]
#     assert json_data==expected
