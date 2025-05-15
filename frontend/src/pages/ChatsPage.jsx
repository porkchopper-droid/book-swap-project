import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import { format, parseISO } from "date-fns";
import "./ChatsPage.scss";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socket = useRef(null);
  const activeSwapIdRef = useRef(null);
  const groupedMessages = {};

  const { user } = useAuth(); // initialize
  const userId = user?._id; // use

  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

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
          const offered = swap.offeredBook?.title || "❓";
          const requested = swap.requestedBook?.title || "❓";

          return (
            <div
              key={swap._id}
              onClick={() => setActiveSwapId(swap._id)}
              className={`chat-item ${
                activeSwapId === swap._id ? "active" : ""
              }`}
            >
              {offered} ⇄ {requested}
            </div>
          );
        })}
      </div>

      <div className="chat-window">
        <h3>Chat</h3>
        <div className="messages">
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="date-block">
              <div className="date-divider">
                {format(new Date(date), "MMMM d, yyyy")}
              </div>

              {msgs.map((msg, index) => {
                const isOwn = msg.sender._id === userId;

                const prevMsg = msgs[index - 1];
                const nextMsg = msgs[index + 1];

                const isSameAsPrev =
                  prevMsg && prevMsg.sender._id === msg.sender._id;
                const isSameAsNext =
                  nextMsg && nextMsg.sender._id === msg.sender._id;

                const showAvatar = !isSameAsNext;

                let positionClass = "";
                if (!isSameAsPrev && isSameAsNext) positionClass = "start";
                else if (isSameAsPrev && isSameAsNext) positionClass = "middle";
                else if (isSameAsPrev && !isSameAsNext) positionClass = "end";
                else positionClass = "single";

                const time = format(new Date(msg.createdAt), "HH:mm");

                return (
                  <div
                    key={msg._id}
                    className={`message-row ${isOwn ? "own" : "incoming"}`}
                  >
                    {/* Incoming avatar (left) */}
                    {!isOwn && (
                      <div className="avatar-container">
                        {showAvatar ? (
                          msg.sender.profilePicture?.trim() ? (
                            <img
                              src={msg.sender.profilePicture}
                              className="avatar"
                              alt="avatar"
                            />
                          ) : (
                            <div className="avatar-fallback">
                              {msg.sender.username?.charAt(0).toUpperCase() ||
                                "?"}
                            </div>
                          )
                        ) : (
                          <div className="avatar-placeholder" />
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`message-bubble ${
                        isOwn ? "own" : "incoming"
                      } ${positionClass}`}
                    >
                      {msg.text}
                      <span className="timestamp">{time}</span>
                    </div>

                    {/* Own avatar (right) */}
                    {isOwn && (
                      <div className="avatar-container">
                        {showAvatar ? (
                          user.profilePicture?.trim() ? (
                            <img
                              src={user.profilePicture}
                              className="avatar"
                              alt="avatar"
                            />
                          ) : (
                            <div className="avatar-fallback">
                              {user.username?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )
                        ) : (
                          <div className="avatar-placeholder" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
