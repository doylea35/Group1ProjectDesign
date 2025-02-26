import pytest
from fastapi.testclient import TestClient

@pytest.fixture(scope ="module")
def test_client():

    from backend.main import app  
    return TestClient(app)

#test fetching all tasks , should initially return a empty list 
def test_get_tasks(test_client):

    response = test_client.get("/tasks/")
    assert response.status_code ==200
    assert isinstance(response.json(),list)  # list of tasks
