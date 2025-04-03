import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function ChatInterface() {
    const { projectId } = useParams(); // Treating projectId as group_id
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSocketReady, setIsSocketReady] = useState(false);
    const ws = useRef(null);

    const userEmail = localStorage.getItem('userEmail');
    const authToken = sessionStorage.getItem('authToken');

    // Helper function to check if projectId is a valid ObjectId-like string
    const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

    // Fetch chat document using group_id from the route
    useEffect(() => {
        const fetchChat = async () => {
            if (!isValidObjectId(projectId)) {
                console.warn("Invalid group_id format (must be 24-character hex):", projectId);
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
                console.log("Chat loaded successfully");
            } catch (error) {
                console.error('Failed to fetch chat:', error.response?.data || error.message);
            }
        };

        if (projectId && authToken) {
            fetchChat();
        }
    }, [projectId, authToken]);

    // Establish WebSocket connection when chatId and userEmail are ready
    useEffect(() => {
        if (!chatId || !userEmail) return;

        const wsUrl = `wss://group-grade-backend-5f919d63857a.herokuapp.com/ws/chat/${chatId}/${userEmail}`;
        console.log("Connecting to WebSocket:", wsUrl);

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
            setIsSocketReady(true);
        };

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);

            if (data.message) {
                setMessages((prev) => [...prev, data]);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket closed");
            setIsSocketReady(false);
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsSocketReady(false);
        };

        const ping = setInterval(() => {
            if (ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(
                    JSON.stringify({
                        message: 'heartbeat',
                        is_heartbeat_msg: true,
                        close_connection: false,
                    })
                );
            }
        }, 40000);

        return () => {
            clearInterval(ping);
            if (ws.current) ws.current.close();
        };
    }, [chatId, userEmail]);

    // Handle sending a new message through WebSocket
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
                sender_email: userEmail,
                is_heartbeat_msg: false,
                close_connection: false,
            })
        );

        setNewMessage('');
    };

    return (
        <div className="chat-container">
            {!isSocketReady && (
                <div className="connecting-message">Connecting to chat...</div>
            )}

            <ul className="message-list">
                {messages.length === 0 && <li>No messages yet.</li>}
                {messages.map((msg, index) => (
                    <li
                        key={index}
                        className={`message-item ${
                            msg.sender === userEmail || msg.sender_email === userEmail ? 'mine' : 'theirs'
                        }`}
                    >
                        {msg.message}
                    </li>
                ))}
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
