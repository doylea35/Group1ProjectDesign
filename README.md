# Group Project Design Group 1

## Installation Guide

This guide provides instructions to set up and run the **GroupGrade** application.

---

### 📌 Frontend Setup
*(Provide installation steps for the frontend here.)*

---

### 🖥️ Backend Setup

#### ✅ Prerequisites
Ensure you have the following installed before proceeding:
- **Python 3.9+** ([Download here](https://www.python.org/downloads/))
- **pip** (comes with Python)

#### 🏁 Installation Steps (Windows)

##### 🔹 Step 1: Navigate to the Backend Directory
Open a terminal (Command Prompt or PowerShell) and run:
```sh
cd "<your-repository-directory>\Group1ProjectDesign\backend"
```
##### 🔹 Step 2: Install the dependencies
 ```sh
pip install -r requirements.txt
```
##### 🔹 Step 3: Start the backend server
 ```sh
 uvicorn main:app --reload
```
To stop the server, simply press ctrl + c

Once the server is running, access the API documentation at:

Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc