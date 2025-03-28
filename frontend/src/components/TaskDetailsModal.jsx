// src/components/TaskDetailsModal.jsx
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";


function TaskDetailsModal({ visible, onClose, task }) {
  if (!task) return null;

  // Calculate the "days left" text
  const dueDate = new Date(task.due_date);
  const now = new Date();
  const diffMs = dueDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysLeftText = diffDays > 0 ? `${diffDays} days left` : "Due date passed";

  // ------------------------------------------------------
  // Handler to update the status for the current task
  // ------------------------------------------------------
  const handleStatusChange = async (newStatus) => {
    try {
      // Make sure user is logged in
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.token) {
        console.error("User not authenticated.");
        return;
      }

      // Example: PUT /tasks/edit?task_id=<TASK._ID>
      // Body: { "updated_fields": { "status": <newStatus> } }
      await axios.put(
        `/tasks/edit?task_id=${task._id}`,  // Make sure _id is returned from the backend
        { updated_fields: { status: newStatus } },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      // Option 1: Reload the entire page so the columns show the new status
      window.location.reload();

      // Option 2 (alternative): Re-fetch tasks in the parent
      // onClose();
      // refetchTasks();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent" style={{ maxWidth: "500px" }}>

          <Dialog.Title className="DialogTitle">{task.name}</Dialog.Title>

          {/* 
            IMPORTANT: Replace nested <p> tags with <div> or <span>
            so you don't get <p> within <p> warnings. 
          */}
          <Dialog.Description className="DialogDescription">
            <div style={{ marginTop: "0.5rem" }}>
              <strong>Due:</strong> {task.due_date} ({daysLeftText})
            </div>
            <div style={{ margin: "0.5rem 0" }}>
              <strong>Description:</strong>{" "}
              {task.description || "No description provided."}
            </div>
            <div style={{ margin: "0.5rem 0" }}>
              <strong>Assigned To:</strong>{" "}
              {Array.isArray(task.assigned_to) && task.assigned_to.length > 0
                ? task.assigned_to.join(", ")
                : "None"}
            </div>
            <div style={{ margin: "0.5rem 0" }}>
              <strong>Labels:</strong>{" "}
              {Array.isArray(task.labels) && task.labels.length > 0
                ? task.labels.join(", ")
                : "None"}
            </div>

            {/* Show comments if any */}
            {Array.isArray(task.comments) && task.comments.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Comments:</strong>
                <ul style={{ marginTop: "0.25rem" }}>
                  {task.comments.map((cmt, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem" }}>
                      <strong>{cmt.commenter}:</strong> {cmt.content} —{" "}
                      <em>{new Date(cmt.timestamp).toLocaleString()}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Dialog.Description>

          {/* 
            Buttons to mark as In Progress or Completed
            Calls handleStatusChange().
          */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            {task.status !== "In Progress" && (
              <button
                className="Button green"
                onClick={() => handleStatusChange("In Progress")}
              >
                Mark In Progress
              </button>
            )}
            {task.status !== "Completed" && (
              <button
                className="Button violet"
                onClick={() => handleStatusChange("Completed")}
              >
                Mark Completed
              </button>
            )}
          </div>

          {/* Close (X) Button */}
          <Dialog.Close asChild>
            <button className="IconButton" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default TaskDetailsModal;
