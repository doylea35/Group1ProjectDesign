import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Sidebar from "./components/Layout";
import CreateProfile from "./components/CreateProfile";
import CreateNewProjectPop from "./pages/CreateProjectPop";
import LoginPage from "./components/LoginPage";
import LogoutPage from "./pages/LogoutPage";
import ProjectPage from "./pages/ProjectPage";
import SchedulingPage from "./pages/SchedulingPage";
import HomePage from "./pages/HomePage";
import RegistrationPage from "./pages/confirmRegistration";
import ConfirmGroupMembershipPage from "./pages/confirmMembership";
import ProjectSettingsPage from "./pages/ProjectSettingsPage";
import ProjectFilesPage from "./pages/FilePage";
import NotificationsPage from "./pages/NotificationPage";
import AccountPage from "./pages/AccountsPage";
import ChatInterface from "./components/ChatInterface";
import axios from "axios";

// axios.defaults.baseURL = "http://127.0.0.1:8000";
// uncomment the following if you want to the frontend to point to the local backend
axios.defaults.baseURL =
  "https://group-grade-backend-5f919d63857a.herokuapp.com";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<Sidebar />}>
        <Route path="create-profile" element={<CreateProfile />} />
        <Route path="create-project" element={<CreateNewProjectPop />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="logout" element={<LogoutPage />} />
        <Route
          path="/confirmRegistration/:confirmationCode"
          element={<RegistrationPage />}
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="/confirmMembership/:user_email/:group_id"
          element={<ConfirmGroupMembershipPage />}
        />
        <Route path="projects/:projectId" element={<ProjectPage />} />
        <Route path="schedule/:projectId" element={<SchedulingPage />} />
        <Route
          path="/project/:projectId/settings"
          element={<ProjectSettingsPage />}
        />
        <Route
          path="/project/:projectId/files"
          element={<ProjectFilesPage />}
        />
        <Route path="/project/:projectId/message" element={<ChatInterface />} />
        <Route path="home" element={<HomePage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
    </Routes>
  );
}

export default App;
