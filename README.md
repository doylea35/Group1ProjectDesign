# **Group Project Design Group 1**

# **Overview**  

## **About the Application**  
📌 **To-Do:** Add a brief overview of the application's purpose and functionality.  

## **Key Features**  
📌 **To-Do:** List the application's main features concisely.  

---

# **Step by Step**  

## **Live Deployment**  
- **Frontend:** Available at🔗 [GroupGrade Frontend](https://groupgrade.vercel.app/)  
- **Backend:** Hosted on **Heroku** at:  
  🔗 [GroupGrade Backend](https://group-grade-backend-5f919d63857a.herokuapp.com/)  

## **Testing the Application**  
You can test the application's functionalities in two ways:  

1️⃣ **Using the Live Deployment**  
- Visit the deployed frontend.  
- Use the credentials provided in the **Login Section** to access the platform.  

2️⃣ **Running Locally**  
If you prefer to run and test the application on your local machine, follow the **Installation Guide** below.  

---

## **Installation Guide**

This guide provides instructions to set up and run the **GroupGrade** application.

---

### 📌 **Frontend Setup**
#### ✅ **Prerequisites**
Ensure you have the following installed before proceeding:
- **Node.js** ([Download here](https://nodejs.org/en ))
---

#### 🏁 Installation Steps (Windows)

#### 🔹  Step 0: Clone this GitHub repository to your local machine
Open a terminal (Command Prompt or PowerShell) and run:
```sh 
git clone https://github.com/doylea35/Group1ProjectDesign.git
```

##### 🔹 Step 1: Navigate to the Frontend Directory
Run:
```sh
cd "<your-repository-directory>\Group1ProjectDesign\frontend"
```
##### 🔹 Step 2: Install the dependencies
Run:
 ```sh
npm install
npm install @radix-ui/react-dialog @radix-ui/react-icons
npm install @radix-ui/colors
```
##### 🔹 Step 3: Start the frontend server
Run:
 ```sh
npm run dev
```

### 🖥️ **Backend Setup**

#### ✅ Prerequisites
Ensure you have the following installed before proceeding:
- **Python 3.9+** ([Download here](https://www.python.org/downloads/))
- **pip** (comes with Python)
- **Git** ([Download here](https://git-scm.com/downloads))

#### 🏁 Installation Steps (Windows)

#### 🔹  Step 0: Clone this GitHub repository to your local machine
Open a terminal (Command Prompt or PowerShell) and run:
```sh 
git clone https://github.com/doylea35/Group1ProjectDesign.git
```

##### 🔹 Step 1: Navigate to the Backend Directory
Run:
```sh
cd "<your-repository-directory>\Group1ProjectDesign\backend"
```
##### 🔹 Step 2: Install the dependencies
Run:
 ```sh
pip install -r requirements.txt
```
##### 🔹 Step 3: Start the backend server
Run:
 ```sh
 uvicorn main:app --reload
```
To stop the server, simply press ctrl + c

Once the server is running, access the API documentation at:

Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc

## **Login**
user: nzhang

# **Backends**
We are using MongoDB as our database.
