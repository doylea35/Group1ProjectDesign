// src/components/TaskDetailsModal.jsx
import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";
import EditTask from "./EditTask"; // <-- import your new EditTask component

function TaskDetailsModal({ visible, onClose, task }) {
  if (!task) return null;

  // Track whether the edit dialog is open
  const [editOpen, setEditOpen] = useState(false);

  const dueDate = new Date(task.due_date);
  const now = new Date();
  const diffMs = dueDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysLeftText = diffDays > 0 ? `${diffDays} days left` : "Due date passed";

  const handleStatusChange = async (newStatus) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.token) {
        console.error("User not authenticated.");
        return;
      }

      await axios.put(
        `/tasks/edit/?task_id=${task.id}`,
        { updated_fields: { status: newStatus } },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      window.location.reload(); // or refetch in parent
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // Called after a successful edit so we can close the detail modal or refetch data
  const handleTaskEdited = () => {
    // Option 1: simply reload the page
    window.location.reload();
    // Option 2: onClose(); parent might re-fetch tasks
    // ...
  };

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent" style={{ maxWidth: "500px" }}>

          <Dialog.Title className="DialogTitle">{task.name}</Dialog.Title>

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

            {/* If you have comments, etc. */}
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

          {/* Status update buttons */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            {task.status !== "To Do" && (
              <button
                className="Button grey"
                onClick={() => handleStatusChange("To Do")}
              >
                Move to To Do
              </button>
            )}
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

          {/* ADD an Edit button that opens the EditTask dialog */}
          <div style={{ marginTop: "1rem" }}>
            <button className="Button" onClick={() => setEditOpen(true)}>
              Edit Task
            </button>
          </div>

          {/* If editOpen is true, show the EditTask form 
              We pass the selected task, plus an onEdit callback and onClose 
          */}
          {editOpen && (
            <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
              <EditTask 
                task={task} 
                onEdit={handleTaskEdited} 
                onClose={() => setEditOpen(false)} 
              />
            </Dialog.Root>
          )}

          {/* Close (X) Button for the TaskDetailsModal */}
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
