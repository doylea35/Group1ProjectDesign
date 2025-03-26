import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import axios from "axios";
import "../App.css";

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
  const [activeTaskId, setActiveTaskId] = useState(null);

  // Label filter from hugh/HEAD
  const [labelFilter, setLabelFilter] = useState("");

  // Fetch tasks (assigned to user) once
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        // GET /tasks?assigned_to=user.email
        const response = await axios.get("/tasks/", {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { assigned_to: user.email },
        });

        if (response.data) {
          // Priority-based sorting from hugh
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };
          const sortedTasks = response.data.sort((a, b) => {
            const prioA = priorityOrder[a.priority] ?? 999;
            const prioB = priorityOrder[b.priority] ?? 999;
            if (prioA !== prioB) {
              return prioA - prioB;
            }
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

  // Fetch project info (for project names) once
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

  const toggleTaskDescription = (taskId) => {
    setActiveTaskId((prev) => (prev === taskId ? null : taskId));
  };

  // Parse typed labels (comma-separated)
  const desiredLabels = labelFilter
    .split(",")
    .map((lbl) => lbl.trim())
    .filter((lbl) => lbl !== "");

  function labelsMatch(taskLabels, wanted) {
    if (!wanted.length) return true; // no filter => all tasks
    return wanted.some((lbl) => taskLabels?.includes(lbl));
  }

  // Filter tasks by label
  const filteredTasks = tasks.filter((task) =>
    labelsMatch(task.labels || [], desiredLabels)
  );

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  // Build separate lists for columns (based on HEAD)
  const todoTasks = filteredTasks.filter((task) => task.status === "To Do");
  const inProgressTasks = filteredTasks.filter((task) => task.status === "In Progress");
  const completedTasks = filteredTasks.filter((task) => task.status === "Completed");

  // For stats bar, we use the number of *filtered* tasks or you could use tasks.length if you prefer
  const totalTasks = filteredTasks.length;
  const completedCount = completedTasks.length;

  return (
    <div className="page-container">
      <PageHeader title="Home" />

      {/* Stats bar (from main) */}
      <StatsBar totalTasks={totalTasks} completedTasks={completedCount} />

      {/* Label filter input (from hugh) */}
      <div style={{ margin: "1rem 0" }}>
        <label htmlFor="labelFilter" style={{ marginRight: "0.5rem" }}>
          Filter by labels (comma-separated):
        </label>
        <input
          id="labelFilter"
          type="text"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          placeholder="e.g. urgent, midterm, meeting"
          style={{ width: "300px" }}
        />
      </div>

      {/* Kanban columns (from main, integrated with HEAD) */}
      <div className="task-columns-wrapper">
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
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    <p className="task-meta">
                      <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                    </p>
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
                <p></p>
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
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    <p className="task-meta">
                      <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                    </p>
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
                <p></p>
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
                    onClick={() => toggleTaskDescription(task._id)}
                  >
                    <h4 className="task-title">{task.name}</h4>
                    <p className="task-meta">
                      <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                    </p>
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
                <p></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
