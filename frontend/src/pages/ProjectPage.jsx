import { useParams, useNavigate } from "react-router-dom";
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";
import {useState} from "react";

function ProjectPage() {
  const { projectId } = useParams(); 
  const navigate = useNavigate(); 

  const handleFindTimeClick = () => {
    if (!projectId) {
        console.error("❌ No projectId found!");
        return;
    }
    navigate(`/schedule/${projectId}`); // ✅ Now the projectId is included in the URL
};


  const handleCreateSubteam = (subteamName, members) => {
    alert(`Subteam "${subteamName}" created for Project ${projectId} with members: ${members.join(", ")}`);
  };

  const handleCreateTask = (taskName, taskDescription, dueDate, subteams, members) => {
    alert(`Task created with:
    - Name: ${taskName}
    - Description: ${taskDescription}
    - Due Date: ${dueDate}
    - Assigned Subteams: ${subteams.length > 0 ? subteams.join(", ") : "None"}
    - Assigned Members: ${members.length > 0 ? members.join(", ") : "None"}`);
};


  return (
    <div className="project-page-container">
      <h1>Project {projectId}</h1>

      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
        <CreateSubteam projectName={`Project ${projectId}`} onCreate={handleCreateSubteam} />
        <CreateTask projectName={`Project ${projectId}`} onCreate={handleCreateTask} />
      </div>
    </div>
  );
}

export default ProjectPage;