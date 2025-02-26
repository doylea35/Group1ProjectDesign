import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";
import axios from "axios";

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

              // Fetch all tasks (no assigned user filter)
              const response = await axios.get(`/tasks/`, {
                  headers: { Authorization: `Bearer ${user.token}` }
              });

              console.log("Tasks API Response:", response.data);

              if (response.data) {
                  const projectTasks = response.data.filter(task => task.group === projectId);
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
      <div className="task-list">
          <h3>Project Tasks</h3>
          {tasks.length > 0 ? (
              <ul>
                  {tasks.map((task) => (
                      <li key={task._id}>
                          <strong>{task.name}</strong> - Assigned to: {task.assigned_to || "No one"}
                      </li>
                  ))}
              </ul>
          ) : (
              <p>No tasks available.</p>
          )}
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

  const handleCreateTask = (taskName, taskDescription, dueDate, subteams, members) => {
    alert(`Task created with:
    - Name: ${taskName}
    - Description: ${taskDescription}
    - Due Date: ${dueDate}
    - Assigned Subteams: ${subteams.length > 0 ? subteams.join(", ") : "None"}
    - Assigned Members: ${members.length > 0 ? members.join(", ") : "None"}`);
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

      {/* Task List Component */}
      <TaskList projectId={projectId} />
    </div>
  );
}

export default ProjectPage;
