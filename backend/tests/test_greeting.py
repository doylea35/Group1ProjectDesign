def test_hello(test_client):

    response = test_client.get("/")
    assert response.status_code== 200
    
    assert response.json()=={"message": "Hello from GroupGrade server", "vesion": "v6"}
