import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import "./ChatsPage.scss";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socket = useRef(null);
  const activeSwapIdRef = useRef(null);

  const { user } = useAuth(); // initialize
  const userId = user?._id; // use

  // Sync activeSwapId to ref (used inside socket listeners)
  useEffect(() => {
    activeSwapIdRef.current = activeSwapId;
  }, [activeSwapId]);

  // Setup Socket.IO connection and listeners
  useEffect(() => {
    if (!user?._id) return; // wait until user is available

    socket.current = io("http://localhost:6969");

    socket.current.on("connect", () => {
      console.log("✅ Socket connected:", socket.current.id);
      socket.current.emit("register", user._id); // ✅ emit only when connected
    });

    window.socket = socket.current;

    socket.current.on("newMessage", (msg) => {
      console.log("🔥 newMessage:", msg);
      console.log(
        "🧠 Comparing:",
        msg.swapId,
        typeof msg.swapId,
        "vs",
        activeSwapIdRef.current,
        typeof activeSwapIdRef.current
      );

      if (!activeSwapIdRef.current) {
        console.warn("📪 No active chat open. Ignoring incoming message.");
        return;
      }

      if (String(msg.swapId) === String(activeSwapIdRef.current)) {
        console.log("✅ Matched. Updating messages.");
        setMessages((prev) => [...prev, msg]);
      } else {
        console.warn("❌ Swap ID mismatch. Not updating.", {
          msgSwapId: msg.swapId,
          activeSwapId: activeSwapId,
        });
      }
    });

    socket.current.on("messageSent", (msg) => {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    });

    return () => {
      socket.current.disconnect();
    };
  }, [user?._id]); // now this only runs when user is ready

  // Fetch list of accepted swap chats on first load
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

  // Fetch messages for selected chat (when activeSwapId changes)
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

  const handleSend = () => {
    if (!newMessage.trim()) return;

    socket.current.emit("sendMessage", {
      swapId: activeSwapId,
      senderId: user._id,
      text: newMessage,
    });
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
          {messages.map((msg) => {
            const isOwn = msg.sender._id === userId;

            return (
              <div
                key={msg._id}
                className={`message ${
                  isOwn ? "own-message" : "incoming-message"
                }`}
              >
                <strong>{msg.sender.username}</strong>: {msg.text}
              </div>
            );
          })}
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
