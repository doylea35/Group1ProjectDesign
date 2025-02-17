import { useState } from "react";;
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from "./assets/react.svg";;
import viteLogo from "/vite.svg";;
import "./App.css";
import CreateNewProjectPop from "./pages/CreateProjectPop"; // Import dialog component;
import CreateProfile from './pages/CreateProfile';

function App() {
  const [count, setCount] = useState(0);;

  return (
    <Router>
      <div>
        <nav>
          <Link to="/">Home</Link>
        </nav>
        <Routes>
          <Route path="/profile" element={<CreateProfile />} />
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
              {/* Link styled as a button */}
              <Link to="/profile" className="create-profile-btn">
                <button>Create Profile</button>
              </Link>
              {/* Add the Create New Project button */}
              <div className="card">
                <CreateNewProjectPop />
              </div>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
