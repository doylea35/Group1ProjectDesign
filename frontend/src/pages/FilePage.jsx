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
  const [filesLoading, setFilesLoading] = useState(true);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);

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

  const fetchFiles = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      setError("User not authenticated. Please log in first.");
      setFilesLoading(false);
      return;
    }
    try {
      setFilesLoading(true);
      const response = await axios.get(
        `https://group-grade-backend-5f919d63857a.herokuapp.com/api/files/?group_id=${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setFiles(response.data.files);
      setFilesLoading(false);
    } catch (err) {
      console.error("Error fetching files:", err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.detail : err.message);
      setFilesLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

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
        `https://group-grade-backend-5f919d63857a.herokuapp.com/api/files/upload?group_id=${projectId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      console.log("File uploaded successfully:", response.data);
      setError("");
      fetchFiles(); 
    } catch (err) {
      console.error("Error uploading file:", err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.detail : err.message);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExtensions = ["png", "jpg", "jpeg", "gif", "bmp", "svg"];
    if (imageExtensions.includes(ext)) {
      return (
        <img 
          src="https://img.icons8.com/material-outlined/48/000000/image.png" 
          alt="Image file" 
          className="file-icon" 
        />
      );
    } else {
      return (
        <img 
          src="https://img.icons8.com/material-outlined/48/000000/document.png" 
          alt="Document file" 
          className="file-icon" 
        />
      );
    }
  };

  const handleDownload = async (file) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        setError("User not authenticated.");
        return;
      }

      const filename = file.filename;
      const encodedFilename = encodeURIComponent(filename);
      const url = `https://group-grade-backend-5f919d63857a.herokuapp.com/api/files/files/${encodedFilename}?group_id=${projectId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      const presignedUrl = response.data.presigned_url;
      window.open(presignedUrl, "_blank");
    } catch (err) {
      console.error("Download error:", err);
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
        <button onClick={() => navigate(`/projects/${projectId}`)} className="back-project-btn">
          Back to Project Page
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

      <div className="upload-container" onClick={handleClick}>
        Click to upload a file
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="files-list-container">
        <h2>Group Files</h2>
        {filesLoading ? (
          <div>Loading files...</div>
        ) : files.length > 0 ? (
          <div className="files-list">
            {files.map((file) => (
              <div key={file._id || file.id} className="file-item">
                <div className="file-icon-wrapper">
                  {getFileIcon(file.filename || file.name)}
                </div>
                <div className="file-info">
                  <div className="file-name">{file.filename || file.name}</div>
                  <div className="file-actions">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(file);
                      }}
                      className="action-icon"
                      title="Download File"
                    >
                      <img
                        src="https://img.icons8.com/material-outlined/24/000000/download.png"
                        alt="Download"
                      />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No files available.</div>
        )}
      </div>
    </div>
  );
}

export default ProjectFilesPage;
