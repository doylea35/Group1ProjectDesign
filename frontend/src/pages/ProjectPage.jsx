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

        // Fetch all tasks and filter for the specific project
        const response = await axios.get(`/tasks/`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });

        console.log("Tasks API Response:", response.data);

        if (response.data) {
          // Filter tasks for the current project and sort by due date
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

  // onCreate is passed to CreateTask but its functionality is now handled within CreateTask (refresh).
  const handleCreateTask = () => {
    // You may do additional stuff here if necessary.
  };

  if (loading) {
    return <p>Loading project...</p>;
  }

  return (
    <div className="project-page-container">
      <PageHeader title={`${projectName}`} />

      <div className="button-container">
        <button className="Button violet" onClick={handleFindTimeClick}>
          Find a Time to Meet
        </button>
        <CreateSubteam projectName={projectName} onCreate={handleCreateSubteam} />
        <CreateTask projectName={projectName} projectId={projectId} onCreate={handleCreateTask} />
      </div>

      <TaskList projectId={projectId} />
    </div>
  );
}

export default ProjectPage;
