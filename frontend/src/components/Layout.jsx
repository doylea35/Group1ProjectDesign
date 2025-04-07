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
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user projects
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

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token || !user.email) return;
      try {
        const response = await axios.post(
          "/api/notifications/get_notifications_by_user",
          { user_email: user.email },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        const unread = response.data.notifications.filter(
          (notification) => !notification.read
        );
        setUnreadCount(unread.length);
      } catch (err) {
        console.error(
          "Error fetching unread notifications:",
          err.response ? err.response.data : err
        );
      }
    };
    fetchUnreadNotifications();
  }, []);
  

  const handleProjectClick = (project) => {
    localStorage.setItem("selectedProject", JSON.stringify(project));
  };

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
        <nav className="sidebar-links active">
          <Link to="/home" className="nav-link">
            Home
          </Link>

          {/* Notifications Tab with Unread Badge */}
          <Link to="/notifications" className="nav-link">
            Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>

          <Link to="/account" className="nav-link">
            My Account
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
