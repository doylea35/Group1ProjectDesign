import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Sidebar from './components/Layout';
import CreateProfile from './pages/CreateProfile';
import CreateNewProjectPop from './pages/CreateProjectPop';
import SchedulingPage from './pages/SchedulingPage';
import LoginPage from './pages/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import LogoutPage from './pages/LogoutPage';

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Sidebar />}>
          <Route path="create-profile" element={<CreateProfile />} />
          <Route path="create-project" element={<CreateNewProjectPop />} />
          <Route path="find-meeting-time" element={<SchedulingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="logout" element={<LogoutPage />} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
      </Routes>
  );
}

export default App;
