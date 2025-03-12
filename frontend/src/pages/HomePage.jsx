import React, { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import axios from "axios";
import "../App.css"; 

export default function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState({}); // Store project names by ID
  const [activeTaskId, setActiveTaskId] = useState(null);

  // NEW: label filter
  const [labelFilter, setLabelFilter] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) {
          setError("User not authenticated.");
          setLoading(false);
          return;
        }

        console.log(`Fetching tasks assigned to: ${user.email}`);

        // Fetch all tasks assigned to the logged-in user
        const response = await axios.get(`/tasks/`, {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { assigned_to: user.email },
        });

        console.log("Tasks API Response:", response.data);

        if (response.data) {
          // Priority order: high first, then medium, then low
          const priorityOrder = { High: 0, Medium: 1, Low: 2 };

          // Sort tasks by priority, then by due date
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
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || !user.token) return;

        console.log("Fetching project details...");

        const response = await axios.get(`/api/group/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        console.log("Projects API Response:", response.data);

        if (response.data?.data) {
          // Store project names using their ID as the key
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
    if (activeTaskId === taskId) {
      setActiveTaskId(null); // If the task is already active, clicking again hides it
    } else {
      setActiveTaskId(taskId); // Else, set it as the active task
    }
  };

  // NEW: parse comma-separated labelFilter
  const desiredLabels = labelFilter
    .split(",")
    .map((lbl) => lbl.trim())
    .filter((lbl) => lbl !== "");

  function labelsMatch(taskLabels, wanted) {
    if (!wanted.length) return true;
    return wanted.some((lbl) => taskLabels?.includes(lbl));
  }

  // Filter the tasks after sorting
  const filteredTasks = tasks.filter((task) =>
    labelsMatch(task.labels || [], desiredLabels)
  );

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <PageHeader title="Home" />
      <h3>Your assigned tasks across all projects</h3>

      {/* NEW: Label filter */}
      <div style={{ marginBottom: "1rem" }}>
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

      {filteredTasks.length > 0 ? (
        <div className="task-list-container">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="task-card"
              onClick={() => toggleTaskDescription(task._id)}
            >
              <h4 className="task-title">{task.name}</h4>
              <p className="task-meta">
                <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
              </p>
              <p className="task-meta">
                <strong>Due:</strong> {task.due_date}
              </p>
              <p className="task-meta">
                <strong>Status:</strong> {task.status} |{" "}
                <strong>Priority:</strong> {task.priority}
              </p>
              <p className="task-meta">
                <strong>Assigned To:</strong> {task.assigned_to?.join(", ")}
              </p>

              {/* NEW: show labels if they exist */}
              {task.labels && task.labels.length > 0 && (
                <p className="task-meta">
                  <strong>Labels:</strong> {task.labels.join(", ")}
                </p>
              )}

              {activeTaskId === task._id && (
                <p className="task-description">
                  {task.description || "No description provided."}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p>No tasks assigned to you.</p>
      )}
    </div>
  );
}
