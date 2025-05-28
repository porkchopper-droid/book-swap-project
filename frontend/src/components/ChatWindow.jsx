import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import axios from "axios";

import "./ChatWindow.scss";

export default function ChatWindow({ swapId }) {
  const { user } = useAuth();
  const userId = user?._id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [swap, setSwap] = useState(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const scrollingUpRef = useRef(false);

  const groupedMessages = {};

  useEffect(() => {
    const fetchSwap = async () => {
      const res = await axios.get(`/api/swaps/${swapId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = res.data;
      setSwap(data);
    };

    fetchSwap();
  }, [swapId]);
  

  const chatPartner =
  swap?.from._id === user._id ? swap.to : swap?.from;


  const fetchMessages = async (before = null) => {
    if (!swapId) return;

    let url = `/api/chats/${swapId}`;
    if (before) {
      scrollingUpRef.current = true;
      url += `?before=${before}`;
    }

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = res.data;

    if (before) {
      const reversed = data.reverse();
      const filtered = reversed.filter(
        (m) => !messages.find((msg) => msg._id === m._id)
      );

      console.log(
        `📦 Actually added: ${filtered.length} (of ${data.length} fetched)`
      );

      setMessages((prev) => [...filtered, ...prev]);
    } else {
      setMessages(data.reverse());
    }

    if (data.length < 20) setHasMore(false);
  };

  useEffect(() => {
    if (!userId || !swapId) return;

    fetchMessages();
    setHasMore(true);

    socket.current = io(import.meta.env.VITE_SOCKET_URL || "/");
    socket.current.emit("register", userId);

    socket.current.on("newMessage", (msg) => {
      if (String(msg.swapId) === String(swapId)) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.current.on("messageSent", (msg) => {
       console.log("✅ messageSent received:", msg);
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    });

    return () => {
      socket.current.disconnect();
    };
  }, [swapId, userId]);

  useEffect(() => {
    if (scrollingUpRef.current) {
      scrollingUpRef.current = false;
      return;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    console.log("📨 SENDING:", newMessage);

    socket.current.emit("sendMessage", {
      swapId,
      senderId: userId,
      text: newMessage,
    });
  };

  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  sorted.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
    groupedMessages[dateKey].push(msg);
  });

  return (
    <>
    <h3>Chat with {chatPartner?.username || "..."}</h3>
      {hasMore && (
        <div
          className="load-earlier"
          onClick={() => {
            const oldest = messages[0]?.createdAt;
            if (oldest) fetchMessages(oldest);
          }}
        >
          ↑ Load earlier messages
        </div>
      )}

      <div className="messages">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="date-block">
            <div className="date-divider">
              {format(new Date(date), "MMMM d, yyyy")}
            </div>

            {msgs.map((msg, index) => {
              const isOwn = msg.sender._id === userId;
              const prev = msgs[index - 1];
              const next = msgs[index + 1];
              const isSameAsPrev = prev && prev.sender._id === msg.sender._id;
              const isSameAsNext = next && next.sender._id === msg.sender._id;
              const showAvatar = !isSameAsNext;

              let positionClass = "single";
              if (!isSameAsPrev && isSameAsNext) positionClass = "start";
              else if (isSameAsPrev && isSameAsNext) positionClass = "middle";
              else if (isSameAsPrev && !isSameAsNext) positionClass = "end";

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
                          <img src={user.profilePicture} className="avatar" />
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

      <div ref={messagesEndRef} />

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
    </>
  );
}
