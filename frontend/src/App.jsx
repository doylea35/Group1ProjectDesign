import { useState } from "react";;
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from "./assets/react.svg";;
import viteLogo from "/vite.svg";;
import "./App.css";
import Sidebar from "./components/Sidebar";
import CreateProfile from "./pages/CreateProfile";
import CreateNewProjectPop from "./pages/CreateProjectPop"; 
import SchedulingPage from "./pages/SchedulingPage";

//placeholders
const ProjectsPage = () => <div>Projects Page</div>;
const LogoutPage = () => <div>Logging Out...</div>;

function App() {
  const [count, setCount] = useState(0);;

  return (
    <Router>
      <Sidebar /> 
      <div>
        <nav>
          <Link to="/">Home</Link>
        </nav>
        <Routes>
          <Route path="/schedule" element={<SchedulingPage />} />
          <Route path="/" element={
            <>
              <div>
                <a href="https://vite.dev" target="_blank">
                  <img src={viteLogo} className="logo" alt="Vite logo" />
                </a>
                <a href="https://react.dev" target="_blank">
                  <img src={reactLogo} className="logo react" alt="React logo" />
                </a>
              </div>
              <h1>Vite + React</h1>
              <div className="card">
                <button onClick={() => setCount(count + 1)}>
                  count is {count}
                </button>
                <p>
                  Edit <code>src/App.jsx</code> and save to test HMR updates
                </p>
              </div>
              <p className="read-the-docs">
                Click on the Vite and React logos to learn more
              </p>
              <div className=".ProfileProjectContainer" style={{ display: "flex", justifyContent: "space-evenly" }}>
                <CreateProfile />
                <CreateNewProjectPop />
              </div>
              <Link to="/schedule" className="schedule-page-btn">
                <button>Find a time to meet your team!</button>
              </Link>
            </>
          } />
          {/* Ensure all sidebar links are properly routed */}
          <Route path="/create-profile" element={<CreateProfile />} />
          <Route path="/create-project" element={<CreateNewProjectPop />} />
          <Route path="/find-meeting-time" element={<SchedulingPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/schedule" element={<SchedulingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
