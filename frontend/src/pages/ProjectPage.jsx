import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";
import axios from "axios";
import "../App.css";

function TaskList({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        console.log(`Fetching tasks for project: ${projectId}`);

        const response = await axios.get(`/tasks/`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        console.log("Tasks API Response:", response.data);

        if (response.data) {
          const projectTasks = response.data
            .filter(task => task.group === projectId)
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

          setTasks(projectTasks);
        } else {
          setError("No tasks found.");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="task-section">
      <h3 className="task-header">Tasks To Do</h3>
      <div className="task-list-container">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="task-card">
              <h4 className="task-title">{task.name}</h4>
              <p className="task-meta">
                <strong>Due:</strong> {task.due_date}
              </p>
              <p className="task-meta">
                <strong>Status:</strong> {task.status} | <strong>Priority:</strong> {task.priority}
              </p>
            </div>
          ))
        ) : (
          <p>No tasks available.</p>
        )}
      </div>
    </div>
  );
}

function GroupMembers({ projectId }) {
  const [acceptedMembers, setAcceptedMembers] = useState([]);
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("GroupMembers component mounted. Checking projectId:", projectId);

    const fetchMembers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) {
          console.error("User not authenticated.");
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        console.log("Fetching all groups for the user...");

        const response = await axios.get("/api/group/", {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        console.log("Group API Response:", response.data);

        if (response.data?.data) {
          const project = response.data.data.find(p => p._id === projectId);
          if (project) {
            // These should match the structure returned by your backend.
            setAcceptedMembers(project.members || []);
            setPendingMembers(project.pending_members || []);
            console.log("Accepted Members:", project.members);
            console.log("Pending Members:", project.pending_members);
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
    } else {
      console.warn("Project ID is missing, not fetching members.");
    }
  }, [projectId]);

  if (loading) return <p>Loading group members...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="group-members-section">
      <h3 className="group-members-header">Group Members</h3>

      <div className="members-category">
        <h4>Accepted Members</h4>
        {acceptedMembers.length > 0 ? (
          acceptedMembers.map((email, index) => (
            <div key={index} className="member-card">
              <h4 className="member-name">{email}</h4>
              <p className="member-status">
                <strong>Status:</strong> accepted
              </p>
            </div>
          ))
        ) : (
          <p>No accepted members available.</p>
        )}
      </div>

      <div className="members-category">
        <h4>Invited (Pending Acceptance)</h4>
        {pendingMembers.length > 0 ? (
          pendingMembers.map((email, index) => (
            <div key={index} className="member-card">
              <h4 className="member-name">{email}</h4>
              <p className="member-status">
                <strong>Status:</strong> invited
              </p>
            </div>
          ))
        ) : (
          <p>No pending invitations available.</p>
        )}
      </div>
    </div>
  );
}

function ProjectPage() {
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

  const handleFindTimeClick = () => {
    if (!projectId) {
      console.error("No projectId found!");
      return;
    }
    navigate(`/schedule/${projectId}`);
  };

  const handleCreateSubteam = (subteamName, members) => {
    alert(`Subteam "${subteamName}" created for Project ${projectName} with members: ${members.join(", ")}`);
  };

  const handleCreateTask = () => {
    // Additional logic if needed.
  };

  if (loading) {
    return <p>Loading project...</p>;
  }

  return (
    <div className="project-page-container">
      <PageHeader title={projectName} />

      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
        <CreateSubteam projectName={projectName} onCreate={handleCreateSubteam} />
        <CreateTask projectName={projectName} projectId={projectId} onCreate={handleCreateTask} />
      </div>

      <TaskList projectId={projectId} />
      <GroupMembers projectId={projectId} />
    </div>
  );
}

export default ProjectPage;
