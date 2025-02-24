import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import "../App.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <button onClick={toggleSidebar} className="toggle-button">
          {isOpen ? "⟨" : "⟩"}
        </button>
        <nav className={`sidebar-links ${isOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/create-profile" className="nav-link">Create Profile</Link>
          <Link to="/create-project" className="nav-link">Create Project</Link>
          <Link to="/find-meeting-time" className="nav-link">Find Meeting Time</Link>
          <Link to="/projects" className="nav-link">Projects</Link>
          <Link to="/logout" className="nav-link">Log Out</Link>
        </nav>
      </div>

      <div className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
