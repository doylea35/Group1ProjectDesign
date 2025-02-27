# **Group Project Design Group 1**

## **About the Application**  
Our application is a streamlined group project management website for users to easily manage their college group projects. It allows users to manage their groups in one location, organising how they will complete their work so that they can deliver high-quality grouo projects on time.

## **Key Features**  
The key features of our application were designed to enhance the user expereince:
  1. Users can create an account, verify their email and then log in to this account to promote security amongst users when creating accounts.
  2. Users can create projects and add other members to these projects who will be prompted to join the group via an email link.
  3. Users can add their free time for group meetings, view the available times of other members and find a time that all users are available for a meeting.
  4. Users can create tasks and assign members to these tasks and view them on their home page and project page.
  5. Users can create subteams and use these as a member to assign tasks to.

---

# **Step by Step**  

## **Live Deployment**  
- **Frontend:** Available at🔗 [GroupGrade Frontend](https://groupgrade.vercel.app/)  
- **Backend:** Hosted on **Heroku** at:  
  🔗 [GroupGrade Backend](https://group-grade-backend-5f919d63857a.herokuapp.com/)  

## **Testing the Application**  
You can test the application's functionalities in two ways:  

1️⃣ **Using the Live Deployment**  
- Visit the deployed frontend (Some functionality might not work).  

## 2️⃣ **Running Locally (Recommended)**  

If you prefer to run and test the application (both frontend and backend) on your local machine, follow the **Installation Guide** below.  

- **Note:** If you run the frontend locally, it will make API calls to the **backend running on your local host**.  
- However, if you want the local frontend to make calls to the **deployed backend**, follow these steps:  

1. Navigate to the following file in the repository:  
<path-to-repository-directory>\Group1ProjectDesign\frontend\src\App.jsx

2. **Modify the `axios.defaults.baseURL` setting:**  
- **Uncomment** the following line:  
  ```javascript
  axios.defaults.baseURL = "https://group-grade-backend-5f919d63857a.herokuapp.com";
  ```
- **Comment out** the following line:  
  ```javascript
  axios.defaults.baseURL = "http://127.0.0.1:8000";
  ```

This change will ensure that the local frontend makes API calls to the **deployed backend** instead of your local backend.

---

- Use the credentials provided in the **Login Section** to access the platform.  

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
cd "<path-to-repository-directory>\Group1ProjectDesign\frontend"
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
cd "<path-to-repository-directory>\Group1ProjectDesign\backend"
```
##### 🔹 Step 2: Install the dependencies
Run:
 ```sh
pip install -r requirements.txt
```
##### 🔹 Step 3: Add .env file
Please go to our BlackBoard submission and download the ".env" file, which contains all the environmental variables necessary for our backend including sensitive API keys, OAuth credentials. And Git is preventing us to commit ".env" file.

Once you have ".env" downloaded. Please place it at:

<path-to-repository-directory>\Group1ProjectDesign\backend\.env


##### 🔹 Step 4: Start the backend server
Run:
 ```sh
 uvicorn main:app --reload
```
To stop the server, simply press ctrl + c

Once the server is running, access the API documentation at:

Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc

## **Login**
Credentials to test our application:
Username/email: zhangnuoxi24@gmail.com
Password: 123456

If the above doesn't work, please try:
Username/email: nzhang@tcd.ie
Password: 123456

# **Backends**

## Database
We are using **MongoDB** as our database. We've invited the following emails to our database:
- aqeelhkazmi@gmail.com
- mfatima@tcd.ie
- tzhou@tcd.ie

If you did not receive the invitation, please follow these steps:

1. Download **MongoDB Compass** using this [link](https://www.mongodb.com/try/download/compass).
2. Once MongoDB Compass is installed, use the following connection string to connect to our cluster:
mongodb+srv://gomilaoa:pVaGpsO0KWUijj2Z@gdp-cluster.1i1e0.mongodb.net/?retryWrites=true&w=majority&appName=GDP-Cluster

**Note:** Our cluster is called **"GroupGrade"**.

---

## GMail API
We've added the following users to our **Google Cloud Project: "GroupGrade"** as **"Viewer"**:
- aqeelhkazmi@gmail.com
- mfatima@tcd.ie
- tzhou@tcd.ie

If you require **higher access**, please let us know.

### ⚠️ OAuth Consent Issue
When running the backend locally, you might be prompted to **log in and give consent** to our application.  
This happens because the **refresh token** in Google OAuth credentials may expire. If that happens:
1. **Log in** using one of the invited emails above.
2. You will be told that "Google hasn’t verified this app". Please select "Continue".
3. You will be prompt "GroupGrade wants access to your Google Account". Please select "Continue".

📩 **Check your email inbox and spam folder** for an email containing **groupgradetcd@gmail.com**.

---

## OpenAI API Platform
Our backend is also calling the **OpenAI GPT-4.0** model.  
We've invited the following emails to our **OpenAI API Platform Project**:
- aqeelhkazmi@gmail.com
- mfatima@tcd.ie
- tzhou@tcd.ie

📩 **Check your email inbox and spam folder** for an email containing **groupgradetcd@gmail.com**.

**groupgradetcd@gmail.com** is the email we used to for Google Cloud and OpenAI.
---

## Heroku
Our backend is deployed on **Heroku**.  
However, since we do **not** have an enterprise account, we **cannot invite you** to our Heroku project.
If you want to see our Heroku Dashboard, please send **nzhang@tcd.ie** an email as he will need to give you:
- Email
- Password
- 6-digits code from Duo Mobile authenticator.



