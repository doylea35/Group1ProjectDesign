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
          // Sort tasks by due date (earliest first)
          const sortedTasks = response.data.sort(
            (a, b) => new Date(a.due_date) - new Date(b.due_date)
          );
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
      setActiveTaskId(null);  // If the task is already active, clicking again hides it
    } else {
      setActiveTaskId(taskId);  // Else, set it as the active task
    }
  };

  if (loading) return <p>Loading tasks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  const todoTasks = tasks.filter(task => task.status === "To Do");
  const inProgressTasks = tasks.filter(task => task.status === "In Progress");
  const completedTasks = tasks.filter(task => task.status === "Completed");

  return (
    <div className="page-container">
      <PageHeader title="Home" />
      <h3>Your tasks</h3>
      <div className="task-columns">
        <div className="task-column">
          <h3>To Do</h3>
          <div className="task-items">
            {todoTasks.length > 0 ? (
              todoTasks.map((task) => (
                <div key={task._id} className="task-card" onClick={() => toggleTaskDescription(task._id)}>
                  <h4 className="task-title">{task.name}</h4>
                  <p className="task-meta">
                    <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                  </p>
                  <p className="task-meta">
                    <strong>Due:</strong> {task.due_date}
                  </p>
                  <p className="task-meta">
                    <strong>Status:</strong> {task.status} | <strong>Priority:</strong> {task.priority}
                  </p>
                  {activeTaskId === task._id && (
                    <p className="task-description">{task.description || "No description provided."}</p>
                  )}
                </div>
              ))
            ) : (
              <p>No tasks in this category.</p>
            )}
          </div>
        </div>
        <div className="task-column">
          <h3>In Progress</h3>
          <div className="task-items">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.map((task) => (
                <div key={task._id} className="task-card" onClick={() => toggleTaskDescription(task._id)}>
                  <h4 className="task-title">{task.name}</h4>
                  <p className="task-meta">
                    <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                  </p>
                  <p className="task-meta">
                    <strong>Due:</strong> {task.due_date}
                  </p>
                  <p className="task-meta">
                    <strong>Status:</strong> {task.status} | <strong>Priority:</strong> {task.priority}
                  </p>
                  {activeTaskId === task._id && (
                    <p className="task-description">{task.description || "No description provided."}</p>
                  )}
                </div>
              ))
            ) : (
              <p>No tasks in this category.</p>
            )}
          </div>
        </div>
        <div className="task-column">
          <h3>Completed</h3>
          <div className="task-items">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <div key={task._id} className="task-card" onClick={() => toggleTaskDescription(task._id)}>
                  <h4 className="task-title">{task.name}</h4>
                  <p className="task-meta">
                    <strong>Project:</strong> {projects[task.group] || "Unknown Project"}
                  </p>
                  <p className="task-meta">
                    <strong>Due:</strong> {task.due_date}
                  </p>
                  <p className="task-meta">
                    <strong>Status:</strong> {task.status} | <strong>Priority:</strong> {task.priority}
                  </p>
                  {activeTaskId === task._id && (
                    <p className="task-description">{task.description || "No description provided."}</p>
                  )}
                </div>
              ))
            ) : (
              <p>No tasks in this category.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}