import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import "../App.css";

function FileUpload() {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    console.log("Uploaded file:", file);
    // UPDATE: with backend logic for file storage etc.
  };

  return (
    <>
      <div className="upload-container" onClick={handleClick}>
        Click or drag to upload a file
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        onChange={handleFileChange}
      />
    </>
  );
}

function ProjectFilesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const projectFromStorage = JSON.parse(
      localStorage.getItem("selectedProject")
    );
    if (projectFromStorage && projectFromStorage._id === projectId) {
      setProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

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
      <FileUpload />
    </div>
  );
}

export default ProjectFilesPage;
