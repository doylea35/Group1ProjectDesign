import React, { useState, useEffect } from "react";
import axios from "axios";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token || !user.email) {
        setError("User not logged in or missing credentials.");
        setLoading(false);
        return;
      }

      try {
        // Fetch all notifications for user
        const response = await axios.post(
          "/api/notifications/get_notifications_by_user",
          { user_email: user.email },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        // If you only want to show unread notifications, you can filter them here:
        const unreadNotifications = response.data.notifications.filter(
          (notification) => !notification.read
        );
        setNotifications(unreadNotifications);
      } catch (err) {
        console.error(
          "Error loading notifications:",
          err.response ? err.response.data : err
        );
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Mark one notification as read
  const handleMarkAsRead = async (notificationId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      await axios.put(
        "/api/notifications/mark_notification_as_read",
        {
          notification_id: notificationId,
          user_email: user.email,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      window.location.reload();
    } catch (err) {
      console.error(
        "Error marking notification as read:",
        err.response ? err.response.data : err
      );
    }
  };

  // Mark *all* unread notifications as read by calling the same endpoint for each
  const handleMarkAllAsRead = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      // No single "mark all" endpoint, so we call the single-notification
      // endpoint in a loop for each unread notification:
      await Promise.all(
        notifications.map((n) =>
          axios.put(
            "/api/notifications/mark_notification_as_read",
            {
              notification_id: n._id || n.id,
              user_email: user.email,
            },
            { headers: { Authorization: `Bearer ${user.token}` } }
          )
        )
      );
      window.location.reload();
    } catch (err) {
      console.error(
        "Error marking all notifications as read:",
        err.response ? err.response.data : err
      );
    }
  };

  return (
    <div className="notifications-page">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <h2 style={{ margin: 0 }}>Notifications</h2>
        {/* "Mark all as read" button with the same .mark-read-btn class */}
        <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
          Mark all as read
        </button>
      </div>

      {loading ? (
        <p>Loading notifications...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : notifications.length === 0 ? (
        <p>You have no new notifications</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((notification) => (
            <li
              key={notification._id || notification.id}
              className={`notification-item ${
                notification.read ? "read" : "unread"
              }`}
            >
              <div className="notification-content">
                <p>{notification.message}</p>
                <small>
                  {new Date(notification.timestamp).toLocaleString()}
                </small>
              </div>
              <button
                className="mark-read-btn"
                onClick={() =>
                  handleMarkAsRead(notification._id || notification.id)
                }
              >
                Mark as read
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
