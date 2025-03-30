import React, { useState, useEffect } from "react";
import { Link, Outlet } from "react-router-dom";
import CreateNewProjectPop from "../pages/CreateProjectPop";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import axios from "axios";
import "../App.css";

const Sidebar = () => {
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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
            project.members.includes(user.email)
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
    localStorage.setItem("selectedProject", JSON.stringify(project));
  };

  // onSuccess callback simply closes the dialog.
  const handleProjectCreationSuccess = () => {
    setDialogOpen(false);
  };

  return (
    <div className="app-layout">
      <div className="sidebar open">
        <div className="sidebar-header">
          <img
            src="/hexlogo.png"
            alt="GroupGrade Logo"
            className="sidebar-logo"
          />
          <h1 className="sidebar-title">GroupGrade</h1>
        </div>
        {/* Toggle button removed to always keep sidebar open */}
        <nav className="sidebar-links active">
          <Link to="/home" className="nav-link">
            Home
          </Link>

          {/* New Notifications Tab */}
          <Link to="/notifications" className="nav-link">
            Notifications
          </Link>

          <Collapsible.Root open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <Collapsible.Trigger asChild>
              <button className={`collapsible-btn ${isProjectsOpen ? "active" : ""}`}>
                <span>Projects</span>
                <span className={`arrow ${isProjectsOpen ? "rotate-90" : ""}`}>›</span>
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content className="collapsible-content">
              {loading ? (
                <p>Loading projects...</p>
              ) : error ? (
                <p className="error-message">{error}</p>
              ) : projects.length > 0 ? (
                projects.map((project) => (
                  <Link
                    key={project._id}
                    to={`/projects/${project._id}`}
                    className="nav-link"
                    onClick={() => handleProjectClick(project)}
                  >
                    {project.name}
                  </Link>
                ))
              ) : (
                <p>No projects found</p>
              )}

              {/* Dialog for Creating a New Project */}
              <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                <Dialog.Trigger asChild>
                  <button
                    className="create-btn"
                    onClick={() => setDialogOpen(true)}
                  >
                    Create New Project
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="DialogOverlay" />
                  <Dialog.Content className="DialogContent">
                    <CreateNewProjectPop onSuccess={handleProjectCreationSuccess} />
                    <Dialog.Close asChild>
                      <button className="close-btn">Close</button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </Collapsible.Content>
          </Collapsible.Root>

          <Link to="/logout" className="nav-link">
            Log Out
          </Link>
        </nav>
      </div>

      <div className="main-content expanded">
        <Outlet />
      </div>
    </div>
  );
};

export default Sidebar;
