import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader"; 
import "../App.css";

function ProjectFilesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const projectFromStorage = JSON.parse(localStorage.getItem("selectedProject"));
    if (projectFromStorage && projectFromStorage._id === projectId) {
      setProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      setError("User not authenticated. Please log in first.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/files/upload?group_id=${projectId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("File uploaded successfully:", response.data);
      setError(""); 
    } catch (err) {
      console.error("Error uploading file:", err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.detail : err.message);
    }
  };

  if (loading) {
    return <div>Loading project...</div>;
  }

  return (
    <div className="files-page-container">
      <PageHeader title={projectName} />
      <div className="top-row">
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          className="back-project-btn"
        >
          Back to Project Page
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <div className="upload-container" onClick={handleClick}>Click to upload a file</div>

      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ProjectFilesPage;
