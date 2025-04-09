# **Group Project Design Group 1**

# **Overview**

## **About the Application**

Our application is a streamlined group project management website for users to easily manage their college group projects. It allows users to manage their groups in one location, organising how they will complete their work so that they can deliver high-quality grouo projects on time.

## **Key Features**

The key features of our application were designed to enhance the user expereince:

1. Users can create an account, verify their email and then log in to this account to promote security amongst users when creating accounts.
2. Users can create projects and add other members to these projects who will be prompted to join the group via an email link.
3. Users can add their free time for group meetings, view the available times of other members and find a time that all users are available for a meeting. A Google Calendar invitation email will be send.
4. Users can create tasks, assign members to these tasks, view them on their home page and project page, and add comments.
5. Users can create subteams and use these as a member to assign tasks to.
7. Users can use the team's groupchats to message teammates.
8. Users can upload and download shared files in the group resources page.
9. Users can edit their profile by changing their username and adding their skills.
10. Users can be notified, in-app and via email, about tasks assigned, commented and updated, as well as invitations to new projects.

---

# **Step by Step**

## **Live Deployment**

- **Frontend:** Available at🔗 [GroupGrade Frontend](https://groupgrade.vercel.app/)
- **Backend:** Hosted on **Heroku** at:  
  🔗 [GroupGrade Backend](https://group-grade-backend-5f919d63857a.herokuapp.com/)

## **Testing the Application**

You can test the application's functionalities in two ways:

1️⃣ **Using the Live Deployment (Recommended)**

- The deployed frontend are connected with the deployed backend.
- Use the deployed frontend via the link above to test the deployed application.
- You could use the credentials in **Login Section**.

2️⃣ **Running Locally **

If you prefer to run and test the application (both frontend and backend) on your local machine, follow the **Installation Guide** below.

- **Note:** If you run the frontend locally, it will still make API calls to the **deployed backend** by default.
- However, if you want the local frontend to make calls to the **local backend running on your machine**, follow these steps:

1. Navigate to the following file in the repository:

```sh
<path-to-repository-directory>\Group1ProjectDesign\frontend\src\App.jsx
```

2. **Modify the `axios.defaults.baseURL` setting:**

- **Comment out** the following line:
  ```javascript
  axios.defaults.baseURL =
    "https://group-grade-backend-5f919d63857a.herokuapp.com";
  ```
- **Uncomment** the following line:
  ```javascript
  axios.defaults.baseURL = "http://127.0.0.1:8000";
  ```

This change will ensure that the local frontend makes API calls to the **local backend** instead of the deployed backend.

---

- Use the credentials provided in the **Login Section** to access the platform.

---


## **Installation Guide**

This guide provides instructions to set up and run the **GroupGrade** application.

---

### 📌 **Frontend Setup**

#### ✅ **Prerequisites**

Ensure you have the following installed before proceeding:

- **Node.js** ([Download here](https://nodejs.org/en))

---

#### 🏁 Installation Steps (Windows)

#### 🔹 Step 0: Clone this GitHub repository to your local machine

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

Our frontend runs on: **http://localhost:5173/**

**When you made an operation through our frontend, if nothing seems to happen, please refresh the page. The changes should appear.**

### 🖥️ **Backend Setup**

#### ✅ Prerequisites

Ensure you have the following installed before proceeding:

- **Python 3.9+** ([Download here](https://www.python.org/downloads/))
- **pip** (comes with Python)
- **Git** ([Download here](https://git-scm.com/downloads))

#### 🏁 Installation Steps (Windows)

#### 🔹 Step 0: Clone this GitHub repository to your local machine
If you have been following the guide for the frontend, skip this step since the repo is already cloned.
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

##### 🔹 **Step 3: Add `.env` File**  

Please go to our **BlackBoard submission** and download the `.env` file, which contains all the **environmental variables** necessary for our backend, including **sensitive API keys** and **OAuth credentials**.  

🚫 **Note:** Git **prevents** us from committing the `.env` file for security reasons.

#### ⚠️ **BlackBoard File Name Issue**
BlackBoard **auto-corrects** the file name `.env` and replaces invalid characters with `_`, because filenames cannot contain a `.` at the beginning.  

- **On BlackBoard, you may see the file named as** `_.env` instead of `.env`.  
- Regardless of whether it is named `.env` or `_env`, please **download it** and **rename it** to `.env`.  

#### 📌 **File Placement**
Once you have have the `.env` file, navigate to:

```sh
<path-to-repository-directory>\Group1ProjectDesign\backend
```
And move ".env" file in the `backend\` folder.

Therefore the correct path to the `.env` file after this should be:

```sh
<path-to-repository-directory>\Group1ProjectDesign\backend\.env
```

---
By default, all the links you received in email (email verification, confirm joining a group etc) are pointed to the deployed frontend i.e all the links will start with https://groupgrade.vercel.app/

When you are running both the frontend and backend locally, and wish these links to point to localhost frontend please change the variable ENV in .env file to DEV.
By default, the variable ENV is set to PROD.
After you changed ENV's value to DEV, all these links will start with http://localhost:5173/ (local frontend)

##### 🔹 Step 4: Start the backend server
Ensure you have navigated to:
```sh
<path-to-repository-directory>\Group1ProjectDesign\backend
```
on your terminal.
Run:

```sh
uvicorn main:app --reload
```

To stop the server, simply press ctrl + c

Once the server is running, access the API documentation at:

Swagger UI: http://127.0.0.1:8000/docs
ReDoc: http://127.0.0.1:8000/redoc

## **Login**

### 🔑 **Test Credentials**

You can use the following credentials to log in and test our application:

- **Username/Email:** `zhangnuoxi24@gmail.com`  
  **Password:** `123456`

If the above credentials do not work, please try:

- **Username/Email:** `nzhang@tcd.ie`  
  **Password:** `123456`

You could also register your email on our application.
If you decided to use your own email, please be aware of the following:

If you registered using our deployed application, your email and password can only login to the deployed version of our app, but not the local version (local frontend pointing to local backend).
If you registered using our app running on local(local frontend pointing to local backend), your email and password will be able to login to the deployed version of our app and the local version.

The reason for this is because you could have a different python version than the deployed backend running on Heroku, which might cause the the password to be hashed differently.

# **Backends**

## Database

We are using **MongoDB** as our database. in Release One we've invited the following emails to our database:

- aqeelhkazmi@gmail.com
- mfatima@tcd.ie
- tzhou@tcd.ie

These emails should also have access in Release Two.

If you did not receive the invitation, please follow these steps:

1. Download **MongoDB Compass** using this [link](https://www.mongodb.com/try/download/compass).
2. Once MongoDB Compass is installed, use the following connection string to connect to our cluster:
   mongodb+srv://gomilaoa:pVaGpsO0KWUijj2Z@gdp-cluster.1i1e0.mongodb.net/?retryWrites=true&w=majority&appName=GDP-Cluster

**Note:** Our cluster is called **"GroupGrade"**.

---

## GMail API and Google Calendar API

We've added the following users to our **Google Cloud Project: "GroupGrade"** as **"Viewer"** in Release One, but these emails should still have access:

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

You might required to do this twice because we have connection to GMail and Google Calendar APIs. So you could be prompted to log
in and give consent, and still encounter an error. Please "ctrl + c" to stop the backend server, and restart it again,
then you will be prompt to log in and give consent again. After you give the consent twice, you should be able to run the backend server without error.

📩 **Check your email inbox and spam folder** for an email containing **groupgradetcd@gmail.com**.

---

## OpenAI API Platform

Our backend is also calling the **OpenAI GPT-4.0** model.  
We've invited the following emails to our **OpenAI API Platform Project**:

- aqeelhkazmi@gmail.com
- mfatima@tcd.ie
- tzhou@tcd.ie

📩 **Check your email inbox and spam folder** for an email containing **groupgradetcd@gmail.com**.

## **groupgradetcd@gmail.com** is the email we used to for Google Cloud and OpenAI.

## Heroku

Our backend is deployed on **Heroku**.  
However, since we do **not** have an enterprise account, we **cannot invite you** to our Heroku project.
If you want to see our Heroku Dashboard, please send **nzhang@tcd.ie** an email as he will need to give you:

- Email
- Password
- 6-digits code from Duo Mobile authenticator.

## Troubleshooting
- When entering new free time slots, the user may get a ```Please fill out all fields before saving.``` error if any of the fields is left to the default values. To solve it, simply manually input the same value and press ```save```

- When downloading the group files, make sure to check for blocked pop-up tabs if nothing is happening.

- When testing the chat feature, you might experience consistency errors if multiple tabs of the same window are open. To resolve this issue, please follow these steps:

------- Log into one user account on our app in one Chrome profile window (for example, use your TCD email in this Google Chrome profile).

------- Log into a different user account on our app in a separate Chrome profile window (for example, use your personal email in another Google Chrome profile).

- When testing locally, if you continuously run into ```500 Internal Server Error``` due to connection errors with mongodb, make the following changes to the ```db_utils.py``` file. Uncomment the following lines:
  ```python
  import certifi
  ```
  ```python
  client : MongoClient = MongoClient(MONGODB_URL, tlsCAFile=certifi.where())
  ```
  and comment the next one:
  ```python
  client : MongoClient = MongoClient(MONGODB_URL)
  ```