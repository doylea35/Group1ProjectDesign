import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ChatInterface() {
  const { projectId } = useParams(); // Treating projectId as group_id
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSocketReady, setIsSocketReady] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null); // Reference for the auto-scroll container

  const user = JSON.parse(localStorage.getItem("user")) || {};
  // const { email: userEmail, name: userName, token: authToken } = user;

  const userEmail = user["email"];
  const userName = user["name"];
  const authToken = user["token"];

  // Helper function to check if projectId is a valid ObjectId-like string
  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  useEffect(() => {
    const fetchChat = async () => {
      if (!isValidObjectId(projectId)) {
        console.warn(
          "Invalid group_id format (must be 24-character hex):",
          projectId
        );
        return;
      }

      try {
        const response = await axios.get(
          `https://group-grade-backend-5f919d63857a.herokuapp.com/api/chat/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const chatData = response.data.data;
        setChatId(chatData._id);
        setMessages(chatData.chat_history || []);
      } catch (error) {
        console.error(
          "Failed to fetch chat:",
          error.response?.data || error.message
        );
      }
    };

    if (projectId && authToken) {
      fetchChat();
    }
  }, [projectId, authToken]);

  useEffect(() => {
    if (!chatId || !userEmail) return;

    const wsUrl = `wss://group-grade-backend-5f919d63857a.herokuapp.com/ws/chat/${chatId}/${userEmail}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsSocketReady(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      scrollToBottom(); // Scroll to bottom on new message
    };

    ws.current.onclose = () => setIsSocketReady(false);
    ws.current.onerror = (error) => setIsSocketReady(false);

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [chatId, userEmail]);

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom when the component mounts
  }, [messages]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.name) {
      console.log("Loaded User Name:", user.name);
    } else {
      console.log("No User Name Found in Local Storage");
    }
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not open");
      return;
    }

    ws.current.send(
      JSON.stringify({
        message: newMessage,
        sender_name: userName,
        sender_email: userEmail,
        is_heartbeat_msg: false,
        close_connection: false,
      })
    );

    setNewMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatIrishTime = (date) => {
    const dt = new Date(date);

    const formatter = new Intl.DateTimeFormat("en-IE", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Europe/Dublin",
    });
    dt.setHours(dt.getHours() + (dt.getTimezoneOffset() < 0 ? 1 : 0));

    return formatter.format(dt);
  };

  return (
    <div className="chat-container">
      {!isSocketReady && (
        <div className="connecting-message">Connecting to chat...</div>
      )}

      <ul className="message-list">
        {messages.map((msg, index) => (
          <li
            key={index}
            className={`message-item ${
              msg.sender === userEmail ? "mine" : "theirs"
            }`}
          >
            <div className="sender-name">{msg.sender_name || "No Name"}</div>
            {msg.message}
            <span className="timestamp">
              {formatIrishTime(msg.delivered_time)}
            </span>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>

      <form onSubmit={sendMessage} className="send-message-form">
        <input
          type="text"
          className="input-message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="send-button" disabled={!isSocketReady}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
