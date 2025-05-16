import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { io } from "socket.io-client";
import { format } from "date-fns";
import "./ChatsPage.scss";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const socket = useRef(null);
  const activeSwapIdRef = useRef(null);
  const scrollingUpRef = useRef(false);
  const messagesEndRef = useRef(null); // for scrolling

  const groupedMessages = {};

  const { user } = useAuth(); // initialize
  const userId = user?._id; // use

  let ohMyGodTheyMatched = null;
  const activeSwap = chats.find((s) => s._id === activeSwapId);

  if (activeSwap) {
    ohMyGodTheyMatched =
      activeSwap.from._id === user._id ? activeSwap.to : activeSwap.from;
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  sortedMessages.forEach((msg) => {
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

  useEffect(() => {
    setHasMore(true); // reset before fetching a new chat
    fetchMessages();
  }, [activeSwapId]);

  const fetchMessages = async (before = null) => {
    if (!activeSwapId) return;

    let url = `http://localhost:6969/api/chats/${activeSwapId}`;
    if (before) {
       scrollingUpRef.current = true;
      url += `?before=${before}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    const data = await res.json();

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

    if (data.length < 20) {
      setHasMore(false); // no more older messages to load
    }
  };

  useEffect(() => {
    if (scrollingUpRef.current) {
      scrollingUpRef.current = false; // ✅ reset flag
      return; // ⛔ Don't auto-scroll down after fetching older messages
    }

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        <h3>My Chats </h3>
        {chats.map((swap) => {
          const offeredBook = swap.offeredBook?.title || "❓";
          const requestedBook = swap.requestedBook?.title || "❓";

          return (
            <div
              key={swap._id}
              onClick={() => setActiveSwapId(swap._id)}
              className={`chat-item ${
                activeSwapId === swap._id ? "active" : ""
              }`}
            >
              {offeredBook} ⇄ {requestedBook}
            </div>
          );
        })}
      </div>

      <div className="chat-window">
        <h3>Chat with {ohMyGodTheyMatched?.username}</h3>
        {activeSwapId && hasMore && (
          <div
            className="load-earlier"
            onClick={() => {
              const oldest = messages[0]?.createdAt;
              if (oldest) {
                fetchMessages(oldest);
              }
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
      </div>
    </div>
  );
}
