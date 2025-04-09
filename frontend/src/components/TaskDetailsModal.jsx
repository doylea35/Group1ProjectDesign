import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Cross2Icon, Pencil1Icon, PaperPlaneIcon } from "@radix-ui/react-icons";
import axios from "axios";
import "../App.css";
import EditTask from "./EditTask";

function TaskDetailsModal({ visible, onClose, task }) {
  if (!task) return null;

  const [editOpen, setEditOpen] = useState(false);

  // Simple due-date logic
  const dueDate = new Date(task.due_date);
  const now = new Date();
  const diffMs = dueDate - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysLeftText = diffDays > 0 ? `${diffDays} days left` : "Due date passed";

  // Local state for comments
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState("");

  // Reset local comment state if `task` changes
  useEffect(() => {
    setComments(task.comments || []);
    setNewComment("");
  }, [task]);

  // Update the task’s status
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
      // Reload or re-fetch
      window.location.reload();
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // Called after editing
  const handleTaskEdited = () => {
    window.location.reload();
  };

  // Add a new comment
  const handleAddComment = async () => {
    const commentText = newComment.trim();
    if (!commentText) return;

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.token) {
        console.error("User not authenticated.");
        return;
      }

      const response = await axios.post(
        `/tasks/${task.id}/comments`,
        { content: commentText },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (response.data?.comment) {
        setComments((prev) => [...prev, response.data.comment]);
      }
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <Dialog.Root open={visible} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="DialogOverlay" />
        <Dialog.Content className="DialogContent" style={{ maxWidth: "500px" }}>
          {/* Title */}
          <Dialog.Title className="DialogTitle">{task.name}</Dialog.Title>

          {/* Pencil (Edit) Icon - top right */}
          <button
            className="IconButton edit-icon"
            aria-label="Edit Task"
            onClick={() => setEditOpen(true)}
          >
            <Pencil1Icon />
          </button>

          {/* Close (X) Button */}
          <Dialog.Close asChild>
            <button className="IconButton close-icon" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>

          {/* Task Info */}
          <Dialog.Description className="DialogDescription" style={{ marginRight: "2.5rem" }}>
            <div style={{ marginTop: "0.2rem" }}>
              <strong>Due:</strong> {task.due_date} ({daysLeftText})
            </div>
            <div style={{ margin: "0.2rem 0" }}>
              <strong>Description:</strong>{" "}
              {task.description || "No description provided."}
            </div>
            <div style={{ margin: "0.2rem 0" }}>
              <strong>Assigned To:</strong>{" "}
              {Array.isArray(task.assigned_to) && task.assigned_to.length > 0
                ? task.assigned_to.join(", ")
                : "None"}
            </div>
            <div style={{ margin: "0.2rem 0" }}>
              <strong>Priority:</strong> {task.priority} {/* Added line for displaying task priority */}
            </div>
            <div style={{ margin: "0.2rem 0" }}>
              <strong>Labels:</strong>{" "}
              {Array.isArray(task.labels) && task.labels.length > 0
                ? task.labels.join(", ")
                : "None"}
            </div>
          </Dialog.Description>

          {/* Status Buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
            {task.status !== "To Do" && (
              <button
                className="Button grey"
                onClick={() => handleStatusChange("To Do")}
              >
                To Do
              </button>
            )}
            {task.status !== "In Progress" && (
              <button
                className="Button green"
                onClick={() => handleStatusChange("In Progress")}
              >
                In Progress
              </button>
            )}
            {task.status !== "Completed" && (
              <button
                className="Button violet"
                onClick={() => handleStatusChange("Completed")}
              >
                Completed
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ marginTop: "1rem" }}>
            {/* Add-Comment Row */}
            <div className="add-comment-row">
              <input
                type="text"
                className="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button className="send-comment-btn" onClick={handleAddComment}>
                <PaperPlaneIcon className="paper-plane-icon" />
              </button>
            </div>

            {/* Existing Comments */}
            <div style={{ marginTop: "0.6rem" }}>
              {comments.length === 0 ? (
                <div style={{ fontStyle: "italic", color: "#777" }}>
                  No comments yet.
                </div>
              ) : (
                comments.map((cmt, idx) => (
                  <div key={idx} style={{ marginBottom: "8px" }}>
                    <div className="comment-email">{cmt.commenter}</div>
                    <div className="comment-box">
                      <div className="comment-text">{cmt.content}</div>
                      <div className="comment-timestamp">
                        {new Date(cmt.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* EditTask Modal */}
          {editOpen && (
            <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
              <EditTask
                task={task}
                onEdit={handleTaskEdited}
                onClose={() => setEditOpen(false)}
              />
            </Dialog.Root>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default TaskDetailsModal;
