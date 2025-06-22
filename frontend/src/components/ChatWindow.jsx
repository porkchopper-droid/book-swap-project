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
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const topSentinelRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const loadingRef = useRef(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const previousScrollHeight = useRef(0);
  const shouldScrollToBottom = useRef(true);

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

  // 3️⃣ Load initial messages
  useEffect(() => {
    if (!swapId) return;

    const loadInitial = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/chats/${swapId}?limit=20`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = res.data.reverse(); // newest → bottom
        setMessages(data);
        setHasMore(data.length >= 20);
        setInitialLoadComplete(true);
        shouldScrollToBottom.current = true;
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Reset state when swapId changes
    setMessages([]);
    setHasMore(true);
    setInitialLoadComplete(false);
    shouldScrollToBottom.current = true;
    
    loadInitial();
  }, [swapId]);

  // 4️⃣ Wire up socket registration + listeners
  useEffect(() => {
    if (!userId || !swapId || !socket) return;

    if (socket.connected) {
      debugLog("✅ ChatWindow sees socket already connected:", socket.id);
      setSocketReady(true);
    }

    const onConnect = () => {
      debugLog("✅ ChatWindow sees socket just now connected:", socket.id);
      setSocketReady(true);
    };
    socket.on("connect", onConnect);

    socket.emit("register", userId);

    const handleNewMessage = (msg) => {
      if (String(msg.swapId) === String(swapId)) {
        setMessages((prev) => [...prev, msg]);
        shouldScrollToBottom.current = true;
      }
    };
    
    const handleMessageSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      shouldScrollToBottom.current = true;
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);

    return () => {
      socket.off("connect", onConnect);
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
    };
  }, [userId, swapId, socket]);

  // 5️⃣ Handle scrolling behavior
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || messages.length === 0) return;

    if (shouldScrollToBottom.current) {
      // More aggressive approach to ensure scroll to bottom
      const scrollToBottom = () => {
        const maxScrollTop = container.scrollHeight - container.clientHeight;
        container.scrollTop = maxScrollTop;
      };
      
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        scrollToBottom();
        // Double-check with setTimeout as backup
        setTimeout(() => {
          scrollToBottom();
          // Final check after a longer delay
          setTimeout(scrollToBottom, 100);
        }, 50);
      });
      
      shouldScrollToBottom.current = false;
    } else if (previousScrollHeight.current > 0) {
      // Maintain scroll position after loading older messages
      requestAnimationFrame(() => {
        const newScrollTop = container.scrollHeight - previousScrollHeight.current;
        container.scrollTop = newScrollTop;
        previousScrollHeight.current = 0;
      });
    }
  }, [messages]);

  // 6️⃣ Intersection Observer for lazy loading
  useEffect(() => {
    if (!initialLoadComplete || !hasMore || !topSentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingRef.current && !isLoading) {
          loadOlderMessages();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "50px 0px 0px 0px", // Trigger 50px before reaching the top
        threshold: 0.1,
      }
    );

    observer.observe(topSentinelRef.current);

    return () => observer.disconnect();
  }, [initialLoadComplete, hasMore, isLoading]);

  // 7️⃣ Load older messages
  const loadOlderMessages = async () => {
    if (!swapId || !hasMore || messages.length === 0 || loadingRef.current) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    // Store current scroll position
    previousScrollHeight.current = container.scrollHeight;
    
    const oldestMessage = messages[0];
    if (!oldestMessage) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const url = `/api/chats/${swapId}?limit=20&before=${encodeURIComponent(oldestMessage.createdAt)}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const data = res.data.reverse();
      
      if (data.length === 0) {
        setHasMore(false);
        return;
      }

      // Filter out duplicates (though this shouldn't happen with proper before query)
      const newMessages = data.filter((newMsg) => 
        !messages.some((existingMsg) => existingMsg._id === newMsg._id)
      );

      if (newMessages.length > 0) {
        setMessages((prev) => [...newMessages, ...prev]);
        setHasMore(data.length >= 20);
      } else {
        setHasMore(false);
      }

    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
      // Don't scroll to bottom when loading older messages
      shouldScrollToBottom.current = false;
    }
  };

  // 8️⃣ Send a message
  const handleSend = () => {
    if (!socketReady) {
      console.error("🚫 Socket isn't ready yet—please wait a moment.");
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

  // 9️⃣ Group messages by date
  const groupedMessages = {};
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  sorted.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), "yyyy-MM-dd");
    if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
    groupedMessages[dateKey].push(msg);
  });

  // 🔟 Determine chat partner
  const chatPartner = swap?.from._id === user._id ? swap.to : swap?.from || {};

  return (
    <div className="chat-window">
      <div className="chat-content" ref={scrollContainerRef}>
        <div className="chat-header">
          <button onClick={() => navigate("/chats")} className="back-button">
            ←
          </button>
          <h3 className="chat-title">
            Chat with {chatPartner === null ? "[deleted user]" : chatPartner?.username || "..."}
          </h3>
        </div>

        <div className="messages">
          {/* Top sentinel for lazy loading */}
          {hasMore && (
            <div ref={topSentinelRef} className="top-sentinel">
              {isLoading && <div className="loading-indicator">Loading older messages...</div>}
            </div>
          )}

          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="date-block">
              <div className="date-divider">{format(new Date(date), "MMMM d, yyyy")}</div>

              {msgs.map((msg, index) => {
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
                const bubbleText = senderDeleted ? "[message removed by deleted user]" : msg.text;
                const avatarLetter = senderDeleted
                  ? "💀"
                  : sender.username?.charAt(0).toUpperCase() || "?";

                return (
                  <div key={msg._id} className={`message-row ${isOwn ? "own" : "incoming"}`}>
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

                    <div
                      className={`message-bubble ${isOwn ? "own" : "incoming"} ${positionClass} ${
                        senderDeleted ? "deleted" : ""
                      }`}
                      title={senderDeleted ? "Message from a deleted user" : sender.username}
                    >
                      {bubbleText}
                      <span className="timestamp">{time}</span>
                    </div>

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
      </div>

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
    </div>
  );
}