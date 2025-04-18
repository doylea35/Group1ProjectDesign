import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import PublicProfile from "../components/PublicProfile"; // imported reusable profile component
import "../App.css";

const API_URI = "/api/group/";

export const updateGroup = async (groupData) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      throw new Error("User not authenticated");
    }

    const res = await axios.put(`${API_URI}updateGroup`, groupData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Error updating group:", err.response?.data || err.message);
    throw err;
  }
};

function GroupMembers({ projectId, projectName }) {
  const [acceptedMembers, setAcceptedMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [newMembersInput, setNewMembersInput] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  // New state for enriched members (with skills populated)
  const [enrichedMembers, setEnrichedMembers] = useState([]);

  const fetchMembers = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      const response = await axios.get(API_URI, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (response.data?.data) {
        // Use the new format: project objects have an "id" field and a "members_details" key
        const project = response.data.data.find((p) => p.id === projectId);
        if (project) {
          // For accepted members, use the enriched members_details array
          setAcceptedMembers(project.members_details || []);
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

  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  // Combine accepted and pending members.
  // For this option, we use the data already returned by the backend.
  useEffect(() => {
    const combinedMembersDict = {};

    // Process accepted members, which are objects with skills
    acceptedMembers.forEach((member) => {
      let email, skills;
      if (typeof member === "string") {
        email = member;
        skills = []; // fallback if not enriched
      } else {
        email = member.email;
        skills = member.skills || [];
      }
      combinedMembersDict[email] = { email, skills, status: "accepted" };
    });

    // Process pending members (which might be plain strings or objects)
    pendingMembers.forEach((member) => {
      let email, skills;
      if (typeof member === "string") {
        email = member;
        skills = [];
      } else {
        email = member.email;
        skills = member.skills || [];
      }
      // Only add pending member if not already accepted.
      if (!combinedMembersDict[email]) {
        combinedMembersDict[email] = { email, skills, status: "invited" };
      }
    });

    // In Option 1, we don't need any extra enrichment; we simply use the data as is.
    const combinedMembers = Object.values(combinedMembersDict);
    setEnrichedMembers(combinedMembers);
  }, [acceptedMembers, pendingMembers]);

  const handleUpdateMembers = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setUpdateMessage("");
    setUpdateError("");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      setUpdateError("User not authenticated.");
      setUpdateLoading(false);
      return;
    }

    const newMembersArray = newMembersInput
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    try {
      const groupData = {
        modification_email: user.email,
        group_id: projectId,
        new_group_name: projectName,
        new_members: newMembersArray,
      };
      const response = await updateGroup(groupData);
      if (response && response.message) {
        setUpdateMessage(response.message);
        fetchMembers();
      } else {
        setUpdateError("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Update error:", error);
      setUpdateError("Failed to update group info.");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) return <p>Loading group members...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="members-card">
      <div className="members-card-header">
        <h2>Project Members</h2>
        <button
          className="edit-toggle-btn"
          onClick={() => setShowEdit(!showEdit)}
        >
          {showEdit ? "Cancel Edit" : "Edit Members"}
        </button>
      </div>

      {showEdit && (
        <form onSubmit={handleUpdateMembers} className="edit-members-form">
          <label htmlFor="newMembersInput">Add New Members:</label>
          <input
            id="newMembersInput"
            type="text"
            placeholder="user1@example.com, user2@example.com"
            value={newMembersInput}
            onChange={(e) => setNewMembersInput(e.target.value)}
          />
          <button type="submit" disabled={updateLoading}>
            {updateLoading ? "Updating..." : "Update"}
          </button>
          {updateMessage && (
            <p className="success-message">{updateMessage}</p>
          )}
          {updateError && <p className="error-message">{updateError}</p>}
        </form>
      )}

      <div className="members-table">
        <div className="members-table-row members-table-header">
          <div className="members-table-cell">Member Profile</div>
          <div className="members-table-cell">Status</div>
        </div>
        {enrichedMembers.length > 0 ? (
          enrichedMembers.map((member, idx) => (
            <div key={idx} className="members-table-row">
              <div className="members-table-cell">
                <PublicProfile
                  email={member.email}
                  skills={member.skills || []}
                />
              </div>
              <div className="members-table-cell">{member.status}</div>
            </div>
          ))
        ) : (
          <div className="members-table-row">
            <div className="members-table-cell" colSpan="2">
              No members available.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectSettingsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [updateNameMessage, setUpdateNameMessage] = useState("");
  const [updateNameError, setUpdateNameError] = useState("");
  const [updateNameLoading, setUpdateNameLoading] = useState(false);

  useEffect(() => {
    const projectFromStorage = JSON.parse(
      localStorage.getItem("selectedProject")
    );
    if (projectFromStorage && projectFromStorage.id === projectId) {
      setProjectName(projectFromStorage.name);
      setNewProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setUpdateNameLoading(true);
    setUpdateNameMessage("");
    setUpdateNameError("");

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.token) {
      setUpdateNameError("User not authenticated.");
      setUpdateNameLoading(false);
      return;
    }

    try {
      const groupData = {
        modification_email: user.email,
        group_id: projectId,
        new_group_name: newProjectName,
        new_members: [],
      };
      const response = await updateGroup(groupData);
      if (response && response.message) {
        setUpdateNameMessage(response.message);
        setProjectName(newProjectName);
        setEditingName(false);
      } else {
        setUpdateNameError("Unexpected response from server.");
      }
    } catch (error) {
      console.error("Update name error:", error);
      setUpdateNameError("Failed to update project name.");
    } finally {
      setUpdateNameLoading(false);
    }
  };

  if (loading) return <p>Loading project settings...</p>;

  return (
    <>
      <div className="settings-header-container">
        <PageHeader title={`${projectName}: Settings`} />
      </div>
      <div
        className="back-button"
        style={{
          position: "absolute",
          top: "100px",
          left: "300px",
          zIndex: "10",
        }}
      >
        <div className="top-row">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="back-project-btn"
          >
            Back to Project Page
          </button>
        </div>
      </div>
      <div className="settings-page-container">
        <div className="project-info-card">
          <label>Project Name:</label>
          {editingName ? (
            <form onSubmit={handleUpdateName}>
              <div className="project-name-container">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="project-name-input"
                />
              </div>
              <button
                type="submit"
                className="edit-name-btn"
                disabled={updateNameLoading}
              >
                {updateNameLoading ? "Updating..." : "Save"}
              </button>
              <button
                type="button"
                className="edit-name-btn"
                onClick={() => {
                  setEditingName(false);
                  setNewProjectName(projectName);
                }}
              >
                Cancel
              </button>
              {updateNameMessage && (
                <p className="success-message">{updateNameMessage}</p>
              )}
              {updateNameError && (
                <p className="error-message">{updateNameError}</p>
              )}
            </form>
          ) : (
            <>
              <div className="project-name-container">
                <input
                  type="text"
                  value={projectName}
                  readOnly
                  className="project-name-input"
                />
              </div>
              <button
                className="edit-name-btn"
                onClick={() => setEditingName(true)}
              >
                Edit Name
              </button>
            </>
          )}
        </div>

        <GroupMembers projectId={projectId} projectName={projectName} />
      </div>
    </>
  );
}

export default ProjectSettingsPage;
