import React, { use, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";
import axios from "axios";
import "../App.css";
import ProjectNavigation from "../components/ProjectNavigator";



// Subcomponent to show stats at top
function StatsBar({ totalTasks, completedTasks }) {
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const remainingTasks = totalTasks - completedTasks;

  return (
    <div className="stats-container">
      <div className="stats-item">
        <div className="stats-icon-circle">
          <img
            src="https://img.icons8.com/?size=100&id=60034&format=png&color=000000"
            alt="Tasks Icon"
          />
        </div>
        <div className="stats-text">
          <div className="stats-label">Your tasks</div>
          <div className="stats-number">{totalTasks}</div>
        </div>
      </div>

      <div className="stats-item">
        <div className="stats-icon-circle">
          <img
            src="https://img.icons8.com/?size=100&id=108535&format=png&color=000000"
            alt="Progress Icon"
          />
        </div>
        <div className="stats-text">
          <div className="stats-label">Progress</div>
          <div className="stats-number">{progressPercent}%</div>
        </div>
      </div>

      <div className="stats-item">
        <div className="stats-icon-circle">
          <img
            src="https://img.icons8.com/?size=100&id=61852&format=png&color=000000"
            alt="Remaining Icon"
          />
        </div>
        <div className="stats-text">
          <div className="stats-label">Tasks remaining</div>
          <div className="stats-number">{remainingTasks}</div>
        </div>
      </div>
    </div>
  );
}

function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  // NEW: label filter from HEAD
  const [labelFilter, setLabelFilter] = useState("");

  // Fetch the project name from localStorage
  useEffect(() => {
    const projectFromStorage = JSON.parse(localStorage.getItem("selectedProject"));
    if (projectFromStorage && projectFromStorage._id === projectId) {
      setProjectName(projectFromStorage.name);
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [projectId]);

  // Fetch tasks for this project
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        const response = await axios.get(`/tasks/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.data) {
          // Priority-based sorting from HEAD
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          const projectTasks = response.data
            .filter((task) => task.group === projectId)
            .sort((a, b) => {
              const prioA = priorityOrder[a.priority] ?? 999;
              const prioB = priorityOrder[b.priority] ?? 999;
              if (prioA !== prioB) return prioA - prioB; // higher priority first
              return new Date(a.due_date) - new Date(b.due_date);
            });

          setTasks(projectTasks);
        } else {
          setError("No tasks found.");
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    };

    console.log("Tasks:", tasks);
  }, [projectId]);

  if (loading) return <p>Loading project...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // Toggle expand/collapse of a single task's description
  const toggleTaskDescription = (taskId) => {
    setActiveTaskId((prev) => (prev === taskId ? null : taskId));
  };

  // Label filter logic
  const desiredLabels = labelFilter
    .split(",")
    .map((l) => l.trim())
    .filter((l) => l !== "");

  function labelsMatch(taskLabels, wanted) {
    if (!wanted.length) return true; // no filter => match all
    return wanted.some((label) => taskLabels?.includes(label));
  }

  // Apply label-based filtering
  const filteredTasks = tasks.filter((task) =>
    labelsMatch(task.labels || [], desiredLabels)
  );

  // Separate tasks by status for columns
  const todoTasks = filteredTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = filteredTasks.filter((task) => task.status === "In Progress");
  const completedTasks = filteredTasks.filter((task) => task.status === "Completed");

  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;

  // For subteam creation & task creation
  const handleCreateSubteam = (subteamName, members) => {
    alert(
      `Subteam "${subteamName}" created for Project ${projectName} with members: ${members.join(", ")}`
    );
  };

  const handleCreateTask = () => {
    // Additional logic if needed
  };

  return (
    <div className="project-page-container">
      {/* Page Header & Stats */}
      <PageHeader title={projectName} />
      <StatsBar totalTasks={totalTasks} completedTasks={completedCount} />
      <ProjectNavigation projectId={projectId} />

      {/* Buttons for subteam & task creation */}
      <div className="button-container">
        <CreateSubteam projectName={projectName} onCreate={handleCreateSubteam} />
        <CreateTask projectName={projectName} projectId={projectId} onCreate={handleCreateTask} />
      </div>

      {/* Label Filter input (from HEAD) */}
      <div style={{ margin: "1rem 0" }}>
        <label htmlFor="labelFilter" style={{ marginRight: "0.5rem" }}>
          Filter by labels (comma-separated):
        </label>
        <input
          id="labelFilter"
          type="text"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          placeholder="e.g. urgent, design, homework"
          style={{ width: "300px" }}
        />
      </div>

      {/* Task Columns */}
      <div className="task-columns-wrapper">
        <h4 className="taskboard-title">Group Taskboard</h4>
        <div className="task-columns">
          {/* TO DO Column */}
          <div className="task-column to-do">
            <h3 className="column-title">To Do</h3>
            <div className="task-items">
              {todoTasks.length > 0 ? (
                todoTasks.map((task) => (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    {activeTaskId === task._id && (
                      <p className="task-description">
                        {task.description || "No description provided."}
                      </p>
                    )}
                    <div className="task-card-footer">
                      <span className="task-date">{task.due_date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No tasks available.</p>
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="task-column in-progress">
            <h3 className="column-title">In Progress</h3>
            <div className="task-items">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.map((task) => (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    {activeTaskId === task._id && (
                      <p className="task-description">
                        {task.description || "No description provided."}
                      </p>
                    )}
                    <div className="task-card-footer">
                      <span className="task-date">{task.due_date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No tasks available.</p>
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="task-column completed">
            <h3 className="column-title">Completed</h3>
            <div className="task-items">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="task-card"
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    {activeTaskId === task._id && (
                      <p className="task-description">
                        {task.description || "No description provided."}
                      </p>
                    )}
                    <div className="task-card-footer">
                      <span className="task-date">{task.due_date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p>No tasks available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectPage;
