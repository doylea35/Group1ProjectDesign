import React, { useState, useEffect, useRef } from "react";
import { useParams,useNavigate } from "react-router-dom";
import axios from "axios";

function ChatInterface() {
  const { projectId } = useParams();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [memberNames, setMemberNames] = useState({});
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userEmail = user["email"];
  const userName = user["name"];
  const authToken = user["token"];

  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  useEffect(() => {
    const fetchChatAndGroup = async () => {
      if (!isValidObjectId(projectId)) {
        console.warn("Invalid chat ID:", projectId);
        return;
      }

      try {
        const chatRes = await axios.get(
          `https://group-grade-backend-5f919d63857a.herokuapp.com/api/chat/${projectId}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const chatData = chatRes.data.data;
        setChatId(chatData._id);
        setMessages(chatData.chat_history || []);

        const groupId = chatData.group_id;

        const groupRes = await axios.get(
          "https://group-grade-backend-5f919d63857a.herokuapp.com/api/group",
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const groupList = groupRes.data.data;
        const currentGroup = groupList.find((g) => g.id === groupId);

        if (!currentGroup) {
          console.warn("Group not found with ID:", groupId);
          return;
        }

        setMemberNames(currentGroup.member_names || {});
        localStorage.setItem("memberNames", JSON.stringify(currentGroup.member_names));
      } catch (error) {
        console.error("Error fetching chat or group:", error.response?.data || error.message);
      }
    };

    if (projectId && authToken) {
      fetchChatAndGroup();
    }
  }, [projectId, authToken]);

  useEffect(() => {
    if (!chatId || !userEmail) return;

    const wsUrl = `wss://group-grade-backend-5f919d63857a.herokuapp.com/ws/chat/${chatId}/${userEmail}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsSocketReady(true);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.is_heartbeat_msg || data.message === "Health ping received!") return;
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    };

    ws.current.onclose = () => setIsSocketReady(false);
    ws.current.onerror = () => setIsSocketReady(false);

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [chatId, userEmail]);

  useEffect(() => {
    const HEARTBEAT_INTERVAL = 15000;
    let heartbeatInterval;

    if (isSocketReady && ws.current) {
      heartbeatInterval = setInterval(() => {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              message: "",
              sender_name: userName,
              sender_email: userEmail,
              is_heartbeat_msg: true,
              close_connection: false,
            })
          );
        }
      }, HEARTBEAT_INTERVAL);
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isSocketReady, userName, userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const cached = localStorage.getItem("memberNames");
    if (cached) {
      setMemberNames(JSON.parse(cached));
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
    <>
    <div
      className="back-button"
      style={{position: "absolute", top: "100px", left: "300px", zIndex: "10", }}
    >
    <div className="top-row">
      <button onClick={() => navigate(`/projects/${projectId}`)} className="back-project-btn">
          Back to Project Page
      </button>
      </div>
    </div>
    <div className="chat-container">
      {!isSocketReady && (
        <div className="connecting-message">Connecting to chat...</div>
      )}

      <ul className="message-list">
        {messages.map((msg, index) => (
          <li
            key={index}
            className={`message-item ${msg.sender === userEmail ? "mine" : "theirs"}`}
          >
            <div className="sender-name">
              {msg.sender === userEmail
                ? "You"
                : memberNames[msg.sender] || msg.sender}
            </div>
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
    </>
  );
}

export default ChatInterface;

