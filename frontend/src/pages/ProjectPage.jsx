import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import CreateSubteam from "../components/CreateSubteam";
import CreateTask from "../components/CreateTask";
import axios from "axios";
import "../App.css";
import ProjectNavigation from "../components/ProjectNavigator";
import TaskDetailsModal from "../components/TaskDetailsModal";

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
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Project name, tasks, error states
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);

  // For label dropdown
  const [availableLabels, setAvailableLabels] = useState([]);
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Ref for detecting clicks outside of the dropdown
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // Pull project name from localStorage
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

        const response = await axios.get("/tasks/", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (response.data) {
          // Sort by priority first, then due date
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          const projectTasks = response.data
            .filter((task) => task.group === projectId)
            .sort((a, b) => {
              const prioA = priorityOrder[a.priority] ?? 999;
              const prioB = priorityOrder[b.priority] ?? 999;
              if (prioA !== prioB) return prioA - prioB;
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
    }
  }, [projectId]);

  // Compute list of available labels from these tasks
  useEffect(() => {
    const uniqueLabels = new Set();
    tasks.forEach((t) => {
      (t.labels || []).forEach((lbl) => uniqueLabels.add(lbl));
    });
    setAvailableLabels(Array.from(uniqueLabels));
  }, [tasks]);

  // Show loading or error states
  if (loading) {
    return (
      <div className="project-page-container">
        <PageHeader title="Loading..." />
        <p>Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-page-container">
        <PageHeader title="Error" />
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // Toggle expand/collapse of a task's description
  const toggleTaskDescription = (taskId) => {
    setActiveTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const closeTaskDetails = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  // OR-based label filter
  const filteredTasks = tasks.filter((task) => {
    if (selectedLabels.length === 0) return true;
    const taskLabels = task.labels || [];
    return taskLabels.some((label) => selectedLabels.includes(label));
  });

  // Separate tasks by status
  const todoTasks = filteredTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "In Progress"
  );
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "Completed"
  );

  // For stats bar
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;

  // Handlers for subteam & task creation
  const handleCreateSubteam = (subteamName, members) => {
    alert(
      `Subteam "${subteamName}" created for Project ${projectName} with members: ${members.join(
        ", "
      )}`
    );
  };

  const handleCreateTask = () => {
    // Additional logic if needed
  };

  // Handlers for label selection
  const handleLabelClick = (label) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleRemoveLabel = (label) => {
    setSelectedLabels((prev) => prev.filter((l) => l !== label));
  };

  return (
    <div className="project-page-container">
      {/* Fixed header, stats and navigation */}
      <PageHeader title={projectName} />
      <StatsBar totalTasks={totalTasks} completedTasks={completedCount} />
      <ProjectNavigation projectId={projectId} />

      {/* Scrollable content area */}
      <div className="content-wrapper">
        {/* Subteam & Task creation buttons */}
        <div className="button-container">
          <CreateSubteam projectName={projectName} onCreate={handleCreateSubteam} />
          <CreateTask
            projectName={projectName}
            projectId={projectId}
            onCreate={handleCreateTask}
          />
        </div>

        {/* Label Filter Dropdown */}
        <div
          className="label-filter-container"
          style={{ marginTop: "1rem", marginBottom: "1rem" }}
        >
          <div
            className="filter-dropdown-toggle"
            style={{
              display: "inline-block",
              marginRight: "1rem",
              position: "relative",
            }}
            ref={dropdownRef}
          >
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="Button">
              Filter by label ▾
            </button>
            {dropdownOpen && (
              <div
                className="label-dropdown"
                style={{
                  position: "absolute",
                  background: "#fff",
                  border: "1px solid #ccc",
                  marginTop: "4px",
                  padding: "8px",
                  zIndex: 10,
                }}
              >
                {availableLabels.length === 0 && (
                  <div style={{ padding: "4px 0" }}>No labels found</div>
                )}
                {availableLabels.map((label) => (
                  <div
                    key={label}
                    style={{
                      padding: "4px 0",
                      cursor: "pointer",
                      fontWeight: selectedLabels.includes(label)
                        ? "bold"
                        : "normal",
                    }}
                    onClick={() => handleLabelClick(label)}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Selected filters (pills) */}
          <div style={{ display: "inline-flex", gap: "8px", flexWrap: "wrap" }}>
            {selectedLabels.map((label) => (
              <div
                key={label}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {label}{" "}
                <span
                  style={{
                    marginLeft: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => handleRemoveLabel(label)}
                >
                  x
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Taskboard Columns */}
        <div className="task-columns-wrapper">
          <h4 className="taskboard-title">Group Taskboard</h4>
          <div className="task-columns">
            {/* TO DO */}
            <div className="task-column to-do">
              <h3 className="column-title">To Do</h3>
              <div className="task-items">
                {todoTasks.length > 0 ? (
                  todoTasks.map((task) => (
                    <div
                      key={task._id}
                      className="task-card"
                      onClickCapture={() => openTaskDetails(task)}
                    >
                      <h4 className="task-title">{task.name}</h4>
                      {activeTaskId === task._id && (
                        <p className="task-description">
                          {task.description || "No description provided."}
                        </p>
                      )}
                      <div className="task-card-footer">
                        <span className="task-date">{task.due_date}</span>
                        <div className="task-labels">
                          {task.labels &&
                            task.labels.map((label, index) => (
                              <span key={index} className="task-label">
                                {label}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No tasks available.</p>
                )}
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="task-column in-progress">
              <h3 className="column-title">In Progress</h3>
              <div className="task-items">
                {inProgressTasks.length > 0 ? (
                  inProgressTasks.map((task) => (
                    <div
                      key={task._id}
                      className="task-card"
                      onClick={() => openTaskDetails(task)}
                    >
                      <h4 className="task-title">{task.name}</h4>
                      {activeTaskId === task._id && (
                        <p className="task-description">
                          {task.description || "No description provided."}
                        </p>
                      )}
                      <div className="task-card-footer">
                        <span className="task-date">{task.due_date}</span>
                        <div className="task-labels">
                          {task.labels &&
                            task.labels.map((label, index) => (
                              <span key={index} className="task-label">
                                {label}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No tasks available.</p>
                )}
              </div>
            </div>

            {/* COMPLETED */}
            <div className="task-column completed">
              <h3 className="column-title">Completed</h3>
              <div className="task-items">
                {completedTasks.length > 0 ? (
                  completedTasks.map((task) => (
                    <div
                      key={task._id}
                      className="task-card"
                      onClick={() => openTaskDetails(task)}
                    >
                      <h4 className="task-title">{task.name}</h4>
                      {activeTaskId === task._id && (
                        <p className="task-description">
                          {task.description || "No description provided."}
                        </p>
                      )}
                      <div className="task-card-footer">
                        <span className="task-date">{task.due_date}</span>
                        <div className="task-labels">
                          {task.labels &&
                            task.labels.map((label, index) => (
                              <span key={index} className="task-label">
                                {label}
                              </span>
                            ))}
                        </div>
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

      <TaskDetailsModal
        visible={showModal}
        onClose={closeTaskDetails}
        task={selectedTask}
      />
    </div>
  );
}

export default ProjectPage;
