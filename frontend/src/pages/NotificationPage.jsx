import React, { useState, useEffect } from "react";
import axios from "axios";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.token) {
        setError("User not logged in.");
        setLoading(false);
        return;
      }
      try {
        // Adjust the endpoint as needed.
        const response = await axios.get("/api/notifications", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        // Assuming response.data.notifications holds your notifications array.
        setNotifications(response.data.notifications);
      } catch (err) {
        setError("Failed to load notifications.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    try {
      // API endpoint to mark a notification as read
      await axios.patch(`/api/notifications/${notificationId}/read`, null, {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).token}`,
        },
      });
      // Update state to reflect the notification is read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Error marking notification as read", err);
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
              key={notification.id}
              className={`notification-item ${notification.read ? "read" : "unread"}`}
            >
              <div className="notification-content">
                <p>{notification.message}</p>
                <small>{new Date(notification.date).toLocaleString()}</small>
              </div>
              {!notification.read && (
                <button onClick={() => handleMarkAsRead(notification.id)}>
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
