// src/components/EditTask.jsx
import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";

const EditTask = ({ task, onEdit, onClose }) => {
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [labelString, setLabelString] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Pre-fill form with existing task data
    if (task) {
      setTaskName(task.name || "");
      setTaskDescription(task.description || "");
      setDueDate(task.due_date || "");
      setTaskPriority(task.priority || "Medium");
      // Convert existing labels array to comma-separated string:
      setLabelString(Array.isArray(task.labels) ? task.labels.join(", ") : "");
    }
  }, [task]);

  const handleUpdateTask = async (event) => {
    event.preventDefault();

    let newErrors = {};
    if (!taskName.trim()) newErrors.taskName = "Task name is required.";
    if (!taskDescription.trim()) newErrors.taskDescription = "Task description is required.";
    if (!dueDate) newErrors.dueDate = "Due date is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Convert comma-separated labels to array
    const labelsArray = labelString
      .split(",")
      .map((lbl) => lbl.trim())
      .filter((lbl) => lbl !== "");

    // Build the fields to update
    const updatedFields = {
      name: taskName,
      description: taskDescription,
      due_date: dueDate,
      priority: taskPriority,
      // status could also be edited here if you wish:
      // status: "In Progress" or ...
      // For now, let's not override status unless you want the user to edit it in the same UI.
      // labels are not yet supported by the /tasks/edit route unless you expand the backend's allowed_fields 
      // so we'll skip them. If you want to also edit labels on the server side, see the explanation below.
    };

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        console.error("User not authenticated.");
        return;
      }

      // The backend’s /tasks/edit route, e.g.:
      // PUT /tasks/edit?task_id=<task.id>
      // body: { "updated_fields": { "name": "...", "description": "...", etc. } }
      await axios.put(
        `/tasks/edit/?task_id=${task.id}`, 
        { updated_fields: updatedFields },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      // Optionally reload or call onEdit() in the parent to refetch tasks
      if (onEdit) {
        onEdit();
      }
      // You can also do a forced reload:
      // window.location.reload();

      // Close the edit dialog
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error("Error updating task:", error.response?.data || error);
      setErrors({ general: "Failed to update task. Please try again." });
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="DialogOverlay" />
      <Dialog.Content className="DialogContent">
        <Dialog.Title className="DialogTitle">Edit Task</Dialog.Title>
        <Dialog.Description className="DialogDescription">
          Make changes to your task.
        </Dialog.Description>
        <form onSubmit={handleUpdateTask}>
          {/* Task Name */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="task-name">Task Name:</label>
            <input
              className="Input"
              id="task-name"
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
            {errors.taskName && <p className="error-message">{errors.taskName}</p>}
          </fieldset>

          {/* Task Description */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="task-desc">Task Description:</label>
            <textarea
              className="Input"
              id="task-desc"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
            {errors.taskDescription && <p className="error-message">{errors.taskDescription}</p>}
          </fieldset>

          {/* Due Date */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="due-date">Due Date:</label>
            <input
              className="Input"
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <p className="error-message">{errors.dueDate}</p>}
          </fieldset>

          {/* Task Priority */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="task-priority">Task Priority:</label>
            <select
              className="Input"
              id="task-priority"
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </fieldset>

          {/* Labels (comma-separated) 
            */}
          <fieldset className="Fieldset">
            <label className="Label" htmlFor="task-labels">Labels (comma-separated):</label>
            <input
              className="Input"
              id="task-labels"
              type="text"
              value={labelString}
              onChange={(e) => setLabelString(e.target.value)}
            />
          </fieldset>

          {/* Buttons */}
          <div style={{ display: "flex", marginTop: 25, justifyContent: "space-between" }}>
            <button type="submit" className="Button green">Update Task</button>
            <Dialog.Close asChild>
              <button className="Button red" onClick={onClose}>Cancel</button>
            </Dialog.Close>
          </div>
        </form>

        {/* Close Button (X) */}
        <Dialog.Close asChild>
          <button className="IconButton" aria-label="Close">
            <Cross2Icon />
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default EditTask;
