import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./ChatsPage.scss";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const { user } = useAuth(); // initialize
  const userId = user?._id; // use

  useEffect(() => {
    const fetchChats = async () => {
      const res = await fetch("http://localhost:6969/api/chats/mine", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setChats(data);
    };

    fetchChats();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeSwapId) return;

      const res = await fetch(
        `http://localhost:6969/api/chats/${activeSwapId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();
  }, [activeSwapId]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:6969/api/chats/${activeSwapId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ text: newMessage }),
        }
      );

      const msg = await res.json();

      setMessages((prev) => [...prev, msg]); // add it to chat window
      setNewMessage(""); // clear input
    } catch (err) {
      console.error("Failed to send:", err);
    }
  };

  return (
    <div className="chats-page">
      <div className="chat-list">
        <h3>My Chats</h3>
        {chats.map((swap) => {
          // Figure out who the "other" person is in this swap
          const otherUser =
            swap.from._id === userId ? swap.to.username : swap.from.username;

          return (
            <div
              key={swap._id}
              onClick={() => setActiveSwapId(swap._id)} // <-- when you click a swap, set it as active
              className={`chat-item ${
                activeSwapId === swap._id ? "active" : ""
              }`}
            >
              {otherUser}
            </div>
          );
        })}
      </div>

      <div className="chat-window">
        <h3>Chat</h3>
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg._id} className="message">
              <strong>{msg.sender.username}</strong>: {msg.text}
            </div>
          ))}
        </div>
        <div className="message-input">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
