import { Outlet, Link, useLocation } from "react-router-dom";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog"; 
import { useState } from "react";
import CreateNewProjectPop from "../pages/CreateProjectPop";

export default function Layout() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const [open, setOpen] = useState(false);

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <nav className="sidebar">
        {/* Logo + title */}
        <div className="logo-container">
          <img src="/hexlogo.png" alt="GroupGrade Logo" className="logo" />
          <h1 className="title">GroupGrade</h1>
        </div>

        {/* Navigation */}
        <Link to="/home" className={`nav-link ${isActive("/home") ? "active" : ""}`}>
          <span>Home</span>
        </Link>

        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger asChild>
            <button className={`collapsible-btn ${open ? "active" : ""}`}>
              <span>Projects</span>
              <span className={`arrow ${open ? "rotate-90" : ""}`}>›</span>
            </button>
          </Collapsible.Trigger>

          <Collapsible.Content className="collapsible-content">
            <Link to="/projects/project1" className={`nav-link ${isActive("/projects/project1") ? "active" : ""}`}>
              Project 1
            </Link>
            <Link to="/projects/project2" className={`nav-link ${isActive("/projects/project2") ? "active" : ""}`}>
              Project 2
            </Link>
            <Link to="/projects/project3" className={`nav-link ${isActive("/projects/project3") ? "active" : ""}`}>
              Project 3
            </Link>
            <Dialog.Root>
              <Dialog.Trigger asChild>
                <button className="create-btn">Create New Project</button>
              </Dialog.Trigger>
              <CreateNewProjectPop />
            </Dialog.Root>
          </Collapsible.Content>
        </Collapsible.Root>

        <Link to="/settings" className={`nav-link ${isActive("/settings") ? "active" : ""}`}>
          <span>Settings</span>
          <span>›</span>
        </Link>

        <Link to="/help" className={`nav-link ${isActive("/help") ? "active" : ""}`}>
          <span>Help</span>
          <span>›</span>
        </Link>
      </nav>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
