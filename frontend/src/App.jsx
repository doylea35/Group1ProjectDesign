import { Routes, Route, } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Layout from "./components/Layout";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import ProjectPage from "./pages/ProjectPage"; 
import SchedulingPage from "./pages/SchedulingPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<Layout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="projects/:projectId" element={<ProjectPage />} />
                <Route path="/schedule" element={<SchedulingPage />} />
            </Route>
        </Routes>
    );
}
