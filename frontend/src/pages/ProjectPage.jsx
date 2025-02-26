import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader"; // Import the PageHeader component
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";

function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const projectFromStorage = JSON.parse(localStorage.getItem("selectedProject"));
    
    if (projectFromStorage && projectFromStorage._id === projectId) {
      // If project is already in localStorage, use that data
      setProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

  const handleFindTimeClick = () => {
    if (!projectId) {
      console.error("❌ No projectId found!");
      return;
    }
    navigate(`/schedule/${projectId}`);
  };

  const handleCreateSubteam = (subteamName, members) => {
    alert(`Subteam "${subteamName}" created for Project ${projectName} with members: ${members.join(", ")}`);
  };

  const handleCreateTask = (taskName, taskDescription, dueDate, subteams, members) => {
    alert(`Task created with:
    - Name: ${taskName}
    - Description: ${taskDescription}
    - Due Date: ${dueDate}
    - Assigned Subteams: ${subteams.length > 0 ? subteams.join(", ") : "None"}
    - Assigned Members: ${members.length > 0 ? members.join(", ") : "None"}`);
  };

  if (loading) {
    return <p>Loading project...</p>;
  }

  return (
    <div className="project-page-container">
      <PageHeader title={`${projectName}`} /> {/* Set project name as the header */}
      
      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
        <CreateSubteam projectName={projectName} onCreate={handleCreateSubteam} />
        <CreateTask projectName={projectName} onCreate={handleCreateTask} />
      </div>
    </div>
  );
}

export default ProjectPage;
