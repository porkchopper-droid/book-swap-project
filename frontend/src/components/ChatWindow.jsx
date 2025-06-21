import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import axios from "axios";
import { useSocket } from "../contexts/SocketContext";
import { debugLog } from "../utils/debug";
import "./ChatWindow.scss";

export default function ChatWindow({ swapId }) {
  const { user } = useAuth();
  const userId = user?._id;
  const socket = useSocket();
  const { clearUnread } = useNotification();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [swap, setSwap] = useState(null);
  const [socketReady, setSocketReady] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollingUpRef = useRef(false);

  // 1️⃣ Clear unread badge when we open this chat
  useEffect(() => {
    if (swapId) {
      clearUnread(swapId);
    }
  }, [swapId, clearUnread]);

  // 2️⃣ Fetch swap info
  useEffect(() => {
    async function fetchSwap() {
      try {
        const res = await axios.get(`/api/swaps/${swapId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setSwap(res.data);
      } catch (err) {
        console.error("Failed to fetch swap:", err);
      }
    }
    if (swapId) {
      fetchSwap();
    }
  }, [swapId]);

  // 3️⃣ Load messages (initial 20 + pagination)
  useEffect(() => {
    async function loadMessages(before = null) {
      if (!swapId) return;
      try {
        let url = `/api/chats/${swapId}`;
        if (before) {
          scrollingUpRef.current = true;
          url += `?before=${before}`;
        }
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = res.data;

        if (before) {
          const reversed = data.reverse();
          const filtered = reversed.filter((m) => !messages.find((msg) => msg._id === m._id));
          setMessages((prev) => [...filtered, ...prev]);
        } else {
          setMessages(data.reverse());
        }

        setHasMore(data.length >= 20);
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    }

    loadMessages();
  }, [swapId]);

  // 4️⃣ Wire up socket registration + listeners
  useEffect(() => {
    if (!userId || !swapId || !socket) return;

    // If the socket is already connected by the time this effect runs,
    // immediately mark it as ready.
    if (socket.connected) {
      debugLog("✅ ChatWindow sees socket already connected:", socket.id);
      setSocketReady(true);
    }

    // Otherwise, wait for the connect event
    const onConnect = () => {
      debugLog("✅ ChatWindow sees socket just now connected:", socket.id);
      setSocketReady(true);
    };
    socket.on("connect", onConnect);

    // Register this userId (put them on the server side, e.g. into a room)
    socket.emit("register", userId);

    const handleNewMessage = (msg) => {
      if (String(msg.swapId) === String(swapId)) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    const handleMessageSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);

    // Cleanup on unmount or any dependency change
    return () => {
      socket.off("connect", onConnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
    };
  }, [userId, swapId, socket]);

  // 5️⃣ Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollingUpRef.current) {
      scrollingUpRef.current = false;
      return;
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 6️⃣ Send a message (only if socketReady)
  const handleSend = () => {
    if (!socketReady) {
      console.error("🚫 Socket isn’t ready yet—please wait a moment.");
      return;
    }
    if (!newMessage.trim()) return;

    debugLog("🔔 Emitting sendMessage →", {
      swapId,
      senderId: userId,
      text: newMessage.trim(),
    });
    socket.emit("sendMessage", {
      swapId,
      senderId: userId,
      text: newMessage.trim(),
    });
  };

  // 7️⃣ Group messages by date
  const groupedMessages = {};
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  sorted.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
    groupedMessages[dateKey].push(msg);
  });

  // 8️⃣ Determine chat partner
  const chatPartner = swap?.from._id === user._id ? swap.to : swap?.from || {};

  return (
    <>
      <div className="chat-header">
        <button onClick={() => navigate("/chats")} className="back-button">
          ← 
        </button>

        <h3 className="chat-title">
          Chat with {chatPartner === null ? "[deleted user]" : chatPartner?.username || "..."}
        </h3>
      </div>

      {hasMore && (
        <div
          className="load-earlier"
          onClick={() => {
            const oldest = messages[0]?.createdAt;

            if (oldest) {
              // Tell our auto‐scroll effect “we’re loading earlier messages,
              // so don’t scroll to bottom after prepend.”
              scrollingUpRef.current = true;

              (async () => {
                try {
                  let url = `/api/chats/${swapId}?before=${oldest}`;

                  const res = await axios.get(url, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                  });

                  const data = res.data.reverse();

                  const filtered = data.filter((m) => !messages.find((msg) => msg._id === m._id));

                  setMessages((prev) => [...filtered, ...prev]);

                  if (data.length < 20) setHasMore(false);
                } catch (err) {
                  console.error("Failed to load earlier messages:", err);
                }
              })();
            }
          }}
        >
          ↑ Load earlier messages
        </div>
      )}

      <div className="messages">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date} className="date-block">
            <div className="date-divider">{format(new Date(date), "MMMM d, yyyy")}</div>

            {msgs.map((msg, index) => {
              // Gracefully handle vanished sender
              const senderDeleted = msg.senderDeleted || msg.sender === null;
              const sender = msg.sender || {};
              const senderId = sender._id;

              const isOwn = !senderDeleted && senderId === userId;
              const prev = msgs[index - 1];
              const next = msgs[index + 1];

              const sameAsPrev = prev && prev.sender?._id === senderId;
              const sameAsNext = next && next.sender?._id === senderId;
              const showAvatar = !sameAsNext;

              let positionClass = "single";
              if (!sameAsPrev && sameAsNext) positionClass = "start";
              else if (sameAsPrev && sameAsNext) positionClass = "middle";
              else if (sameAsPrev && !sameAsNext) positionClass = "end";

              const time = format(new Date(msg.createdAt), "HH:mm");

              // Decide bubble text & avatar fallback
              const bubbleText = senderDeleted ? "[message removed by deleted user]" : msg.text;
              const avatarLetter = senderDeleted
                ? "💀"
                : sender.username?.charAt(0).toUpperCase() || "?";

              return (
                <div key={msg._id} className={`message-row ${isOwn ? "own" : "incoming"}`}>
                  {/* Incoming avatar (left) */}
                  {!isOwn && (
                    <div className="avatar-container">
                      {showAvatar ? (
                        sender.profilePicture?.trim() && !senderDeleted ? (
                          <img src={sender.profilePicture} className="avatar" alt="avatar" />
                        ) : (
                          <div className="avatar-fallback">{avatarLetter}</div>
                        )
                      ) : (
                        <div className="avatar-placeholder" />
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`message-bubble ${isOwn ? "own" : "incoming"} ${positionClass} ${
                      senderDeleted ? "deleted" : ""
                    }`}
                    title={senderDeleted ? "Message from a deleted user" : sender.username}
                  >
                    {bubbleText}
                    <span className="timestamp">{time}</span>
                  </div>

                  {/* Own avatar (right) */}
                  {isOwn && (
                    <div className="avatar-container">
                      {showAvatar ? (
                        user.profilePicture?.trim() ? (
                          <img src={user.profilePicture} className="avatar" alt="avatar" />
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
          placeholder={socketReady ? "Type your message..." : "Connecting… please wait"}
          rows={2}
          disabled={!socketReady}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (socketReady) handleSend();
            }
          }}
        />
        <button onClick={handleSend} disabled={!socketReady || !newMessage.trim()}>
          Send
        </button>
      </div>
    </>
  );
}
