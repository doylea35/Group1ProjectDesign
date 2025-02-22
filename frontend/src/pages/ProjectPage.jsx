import { useParams, useNavigate } from "react-router-dom"; 

function ProjectPage() {
  const { projectId } = useParams(); 
  const navigate = useNavigate(); 

  const handleFindTimeClick = () => {
    navigate("/schedule"); 
  };

  return (
    <div className="project-page-container">
      <h1>Project {projectId}</h1>

      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
      </div>
    </div>
  );
}

export default ProjectPage;

