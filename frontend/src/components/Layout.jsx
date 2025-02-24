import React, { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import CreateNewProjectPop from "../pages/CreateProjectPop";
import CreateProfilePopup from "./CreateProfile";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import "../App.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false); // Define collapsible state
  const [createProfileOpen, setCreateProfileOpen] = useState(false);

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
          <button className="nav-link" onClick={() => setCreateProfileOpen(true)}>Create Profile</button>
          
          <Dialog.Root open={createProfileOpen} onOpenChange={setCreateProfileOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="DialogOverlay" />
              <Dialog.Content className="DialogContent">
                <CreateProfilePopup open={createProfileOpen} setOpen={setCreateProfileOpen} />
                <Dialog.Close asChild>
                  <button className="close-btn">Close</button>
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Collapsible.Root open={isProjectsOpen} onOpenChange={setIsProjectsOpen}>
            <Collapsible.Trigger asChild>
              <button className={`collapsible-btn ${isProjectsOpen ? "active" : ""}`}>
                <span>Projects</span>
                <span className={`arrow ${isProjectsOpen ? "rotate-90" : ""}`}>›</span>
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content className="collapsible-content">
              <Link to="/projects/project1" className="nav-link">Project 1</Link>
              <Link to="/projects/project2" className="nav-link">Project 2</Link>
              <Link to="/projects/project3" className="nav-link">Project 3</Link>

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
