import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import CreateNewProjectPop from "../pages/CreateProjectPop";
import CreateProfilePopup from "./CreateProfile";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import axios from "axios";
import "../App.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProjects = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
  
      try {
        const response = await axios.get("/api/group/", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
  
        if (response.data?.data) {
          // Filter projects where the user is a member
          const userProjects = response.data.data.filter((project) =>
            project.members.includes(user.email)  // Assuming `user.email` is in the `members` array
          );
          setProjects(userProjects);
        } else {
          setError("Invalid response structure.");
        }
      } catch (error) {
        setError("Failed to load projects.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserProjects();
  }, []);

  const handleProjectClick = (project) => {
    // Save the project details in localStorage
    localStorage.setItem("selectedProject", JSON.stringify(project));
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="app-layout">
      <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <img src="/hexlogo.png" alt="GroupGrade Logo" className="sidebar-logo" />
          <h1 className="sidebar-title">GroupGrade</h1>
        </div>
        <button onClick={toggleSidebar} className="toggle-button">
          {isOpen ? "⟨" : "⟩"}
        </button>
        <nav className={`sidebar-links ${isOpen ? "active" : ""}`}>
          <Link to="/" className="nav-link">Home</Link>
        

          <Collapsible.Root open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <Collapsible.Trigger asChild>
              <button className={`collapsible-btn ${isProjectsOpen ? "active" : ""}`}>
                <span>Projects</span>
                <span className={`arrow ${isProjectsOpen ? "rotate-90" : ""}`}>›</span>
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content className="collapsible-content">
              {/* Loading/Error Handling */}
              {loading ? (
                <p>Loading projects...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <Link
                    key={project._id} // Use unique project ID
                    to={`/projects/${project._id}`} 
                    className="nav-link"
                    onClick={() => handleProjectClick(project)} // Save project details to localStorage on click
                  >
                    {project.name} {/*  */}
                  </Link>
                ))
              ) : (
                <p>No projects found</p>
              )}

              {/* Dialog for Creating a New Project */}
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <button className="create-btn">Create New Project</button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="DialogOverlay" />
                  <Dialog.Content className="DialogContent">
                    <CreateNewProjectPop />
                    <Dialog.Close asChild>
                      <button className="close-btn">Close</button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </Collapsible.Content>
          </Collapsible.Root>

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
