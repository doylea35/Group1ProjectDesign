import { useParams, useNavigate } from "react-router-dom";
import CreateSubteam from "../components/CreateSubteam";

function ProjectPage() {
  const { projectId } = useParams(); 
  const navigate = useNavigate(); 

  const handleFindTimeClick = () => {
    navigate("/schedule"); 
  };

  const handleCreateSubteam = (subteamName, members) => {
    alert(`Subteam "${subteamName}" created for Project ${projectId} with members: ${members.join(", ")}`);
  };

  return (
    <div className="project-page-container">
      <h1>Project {projectId}</h1>

      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
        <CreateSubteam projectName={`Project ${projectId}`} onCreate={handleCreateSubteam} />
      </div>
    </div>
  );
}

export default ProjectPage;