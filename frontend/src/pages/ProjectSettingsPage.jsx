// ProjectSettingsPage.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import "../App.css";

function GroupMembers({ projectId }) {
  const [acceptedMembers, setAcceptedMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }
        const response = await axios.get("/api/group/", {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (response.data?.data) {
          const project = response.data.data.find((p) => p._id === projectId);
          if (project) {
            setAcceptedMembers(project.members || []);
            setPendingMembers(project.pending_members || []);
          } else {
            setError("Group not found in response.");
          }
        } else {
          setError("Invalid response format.");
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        setError("Failed to load group members.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  if (loading) return <p>Loading group members...</p>;
  if (error) return <p className="error-message">{error}</p>;

  const combinedMembers = [
    ...acceptedMembers.map(member => ({ email: member, status: "accepted" })),
    ...pendingMembers.map(member => ({ email: member, status: "invited" })),
  ];

  return (
    <div className="group-members-section">
      <div className="member-table">
        <div className="member-table-header">
          <div className="member-table-column">Member</div>
          <div className="member-table-column">Status</div>
        </div>
        {combinedMembers.length > 0 ? (
          combinedMembers.map((member, index) => (
            <div key={index} className="member-table-row">
              <div className="member-table-cell">{member.email}</div>
              <div className="member-table-cell">{member.status}</div>
            </div>
          ))
        ) : (
          <p>Error: No members available.</p>
        )}
      </div>
    </div>
  );
}

function ProjectSettingsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const projectFromStorage = JSON.parse(localStorage.getItem("selectedProject"));
    if (projectFromStorage && projectFromStorage._id === projectId) {
      setProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

  if (loading) {
    return <p>Loading project settings...</p>;
  }

  return (
    <div className="project-settings-container">
      <div className="project-header-container" style={{ position: "relative" }}>
        <PageHeader title={`${projectName} Settings`} />
        <div className="back-button">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="Button violet"
          >
            Back to Project
          </button>
        </div>
      </div>
      <GroupMembers projectId={projectId} />
    </div>
  );
}

export default ProjectSettingsPage;
