def test_get_tasks(test_client):
    response = test_client.get("/tasks/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

