import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/Layout';
import CreateProfile from './components/CreateProfile';
import CreateNewProjectPop from './pages/CreateProjectPop';
import LoginPage from './components/LoginPage';
import LogoutPage from './pages/LogoutPage';
import ProjectPage from './pages/ProjectPage';
import SchedulingPage from './pages/SchedulingPage';
import HomePage from './pages/HomePage';
import axios from 'axios';

axios.defaults.baseURL = 'https://group-grade-backend-5f919d63857a.herokuapp.com';

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Sidebar />}>
          <Route path="create-profile" element={<CreateProfile />} />
          <Route path="create-project" element={<CreateNewProjectPop />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
          <Route path="projects/:projectId" element={<ProjectPage />} />
          <Route path="schedule" element={<SchedulingPage />} />
          <Route path="home" element={<HomePage/>} />

        </Route>
      </Routes>
  );
}

export default App;
