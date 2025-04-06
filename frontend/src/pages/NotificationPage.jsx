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

      const url = "/api/notifications/get_notifications_by_user";
      const data = { user_email: user.email };

      console.log("Sending POST request to:", url, "with body:", data);

      try {
        const response = await axios.get(url, data, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        
        console.log("Notifications response:", response.data);
        setNotifications(response.data.notifications);
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

  const handleMarkAsRead = async (notificationId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    try {
      await axios.put(
        "/api/notifications/mark_notification_as_read",
        {
          notification_id: notificationId,
          user_email: user.email,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((notification) =>
          (notification._id || notification.id) === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error(
        "Error marking notification as read:",
        err.response ? err.response.data : err
      );
    }
  };

  return (
    <div className="notifications-page">
      <h2>Notifications</h2>
      {loading ? (
        <p>Loading notifications...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : notifications.length === 0 ? (
        <p>No notifications available</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((notification) => (
            <li
              key={notification._id || notification.id}
              className={`notification-item ${notification.read ? "read" : "unread"}`}
            >
              <div className="notification-content">
                <p>{notification.message}</p>
                <small>{new Date(notification.timestamp).toLocaleString()}</small>
              </div>
              {!notification.read && (
                <button onClick={() => handleMarkAsRead(notification._id || notification.id)}>
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
