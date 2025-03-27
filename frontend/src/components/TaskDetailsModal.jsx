// src/components/TaskDetailsModal.jsx
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon } from "@radix-ui/react-icons";
import "../App.css";

/**
 * The `TaskDetailsModal` expects:
 *  - visible (bool) to show/hide
 *  - onClose (func) called when user clicks outside or on "X"
 *  - task (object) containing name, due_date, description, assigned_to, labels, comments
 */
function TaskDetailsModal({ visible, onClose, task }) {
  if (!task) return null;

  const dueDate = new Date(task.due_date);
  const now = new Date();
  const diffMs = dueDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Round up
  const daysLeftText = diffDays > 0 ? `${diffDays} days left` : "Due date passed";

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent" style={{ maxWidth: "500px" }}>
          <Dialog.Title className="DialogTitle">{task.name}</Dialog.Title>
          <Dialog.Description className="DialogDescription">
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Due:</strong> {task.due_date} ({daysLeftText})
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Description:</strong> {task.description || "No description provided."}
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Assigned To:</strong>{" "}
              {Array.isArray(task.assigned_to) && task.assigned_to.length > 0
                ? task.assigned_to.join(", ")
                : "None"}
            </p>
            <p style={{ margin: "0.5rem 0" }}>
              <strong>Labels:</strong>{" "}
              {Array.isArray(task.labels) && task.labels.length > 0
                ? task.labels.join(", ")
                : "None"}
            </p>
            {/* Comments */}
            {Array.isArray(task.comments) && task.comments.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Comments:</strong>
                <ul style={{ marginTop: "0.25rem" }}>
                  {task.comments.map((cmt, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem" }}>
                      <strong>{cmt.commenter}:</strong> {cmt.content}
                      {" — "}
                      <em>{new Date(cmt.timestamp).toLocaleString()}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Dialog.Description>

          {/* Close Button (X) */}
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
