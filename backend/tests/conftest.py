import sys
import os
import pytest
from fastapi.testclient import TestClient

# have to make sure that 'backend/' is in python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))



from backend.main import app

@pytest.fixture(scope ="module")
def test_client():

    client=TestClient(app)
    yield client
