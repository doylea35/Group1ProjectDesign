import { Routes, Route, } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import Layout from "./components/Layout";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import Project1 from "./pages/projects/project1";
import Project2 from "./pages/projects/project2";
import Project3 from "./pages/projects/project3";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route element={<Layout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/projects/project1" element={<Project1 />} />
                <Route path="/projects/project2" element={<Project2 />} />
                <Route path="/projects/project3" element={<Project3 />} />
            </Route>
        </Routes>
    );
}