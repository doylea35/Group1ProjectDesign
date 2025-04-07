import React, { useEffect, useState, useRef } from "react";
import PageHeader from "../components/PageHeader";
import axios from "axios";
import "../App.css";
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

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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

  // Fetch tasks assigned to user
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
          params: { assigned_to: user.email },
        });
        if (response.data) {

          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          const sortedTasks = response.data.sort((a, b) => {
            const prioA = priorityOrder[a.priority] ?? 999;
            const prioB = priorityOrder[b.priority] ?? 999;
            if (prioA !== prioB) return prioA - prioB;
            return new Date(a.due_date) - new Date(b.due_date);
          });
          setTasks(sortedTasks);
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

    fetchTasks();
  }, []);

  // Fetch project info (for project names)
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.token) return;
        const response = await axios.get("/api/group/", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (response.data?.data) {
          const projectMap = {};
          response.data.data.forEach((project) => {
            projectMap[project._id] = project.name;
          });
          setProjects(projectMap);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  // Compute list of available labels from the tasks
  useEffect(() => {
    const uniqueLabels = new Set();
    tasks.forEach((t) => {
      (t.labels || []).forEach((lbl) => uniqueLabels.add(lbl));
    });
    setAvailableLabels(Array.from(uniqueLabels));
  }, [tasks]);

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // OR-based label filter
  const filteredTasks = tasks.filter((task) => {
    if (selectedLabels.length === 0) return true;
    const taskLabels = task.labels || [];
    // Show task if it has any one of the selected labels
    return taskLabels.some((label) => selectedLabels.includes(label));
  });

  // Separate tasks by status
  const todoTasks = filteredTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "In Progress"
  );

  const completedTasks = filteredTasks.filter((task) => task.status === "Completed");
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;

  // Click handlers for modal
  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };
  const closeTaskDetails = () => {
    setShowModal(false);
    setSelectedTask(null);
  };

  // Handlers for label selection
  const handleLabelClick = (label) => {
    // If label is already selected, remove it; else add it
    setSelectedLabels((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  // Handler to remove a label when the user clicks the "x"
  const handleRemoveLabel = (label) => {
    setSelectedLabels((prev) => prev.filter((l) => l !== label));
  };

  return (
    <>
      <div className="page-container">
        <div className="header-section">
          <PageHeader title="Home" />
          <StatsBar totalTasks={totalTasks} completedTasks={completedCount} />
        </div>
  
        <div className="content-wrapper">
          <div className="task-columns-wrapper">
          <div className="board-header-home">
            <div className="taskboard-title"> <h4>Your Taskboard</h4> </div>
              <div className="filter-dropdown-toggle" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="filter-button"
                > Filter by label ▾
                </button>
                {dropdownOpen && (
                  <div className="SelectContent">
                    <div className="SelectViewport">
                      {availableLabels.length === 0 && (
                        <div className="SelectItem">No labels found</div>
                      )}
                      {availableLabels.map((label) => (
                        <div key={label} className="SelectItem" data-highlighted={ selectedLabels.includes(label) ? "true" : "false"}
                          onClick={() => handleLabelClick(label)}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                    </div>
                  )}
                </div>
                <div >
                {selectedLabels.map((label) => (
                  <div key={label} className="selected-label-pill">
                    {label}
                    <span className="remove-label" onClick={() => handleRemoveLabel(label)}>
                      &#x2715;
                    </span>
                  </div>
                ))}
                </div>
              </div>
            <div className="task-columns">
              {/* TO DO Column */}
              <div className="task-column to-do">
                <h3 className="column-title">To Do</h3>
                <div className="task-items">
                  {todoTasks.length > 0 ? (
                    todoTasks.map((task) => (
                      <div key={task._id} className="task-card" onClick={() => openTaskDetails(task)}>
                        <h4 className="task-title">{task.name}</h4>
                        <p className="task-meta">
                          <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                        </p>
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
                    <p>No tasks in this column.</p>
                  )}
                </div>
              </div>
              {/* IN PROGRESS Column */}
              <div className="task-column in-progress">
                <h3 className="column-title">In Progress</h3>
                <div className="task-items">
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map((task) => (
                      <div key={task._id} className="task-card" onClick={() => openTaskDetails(task)}>
                        <h4 className="task-title">{task.name}</h4>
                        <p className="task-meta">
                          <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                        </p>
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
                    <p>No tasks in this column.</p>
                  )}
                </div>
              </div>
              {/* COMPLETED Column */}
              <div className="task-column completed">
                <h3 className="column-title">Completed</h3>
                <div className="task-items">
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task) => (
                      <div key={task._id} className="task-card" onClick={() => openTaskDetails(task)}>
                        <h4 className="task-title">{task.name}</h4>
                        <p className="task-meta">
                          <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                        </p>
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
                    <p>No tasks in this column.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TaskDetailsModal visible={showModal} onClose={closeTaskDetails} task={selectedTask} />
    </>
  );
}  