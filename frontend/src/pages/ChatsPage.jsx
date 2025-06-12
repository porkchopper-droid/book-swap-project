import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import axios from "axios";
import SVGBackgroundGrid from "../components/ChatSVGBackgroundGrid.jsx";
import { useNotification } from "../contexts/NotificationContext";

import "./ChatsPage.scss";

export default function ChatsPage() {
  const { swapId } = useParams();
  const navigate = useNavigate();
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [chats, setChats] = useState([]);

  // Pull in unreadCounts from NotificationContext:
  const { unreadCounts } = useNotification();

  useEffect(() => {
    if (swapId) setActiveSwapId(swapId); // ✅ Sync URL to state
  }, [swapId]);

  // Fetch list of “chats” (swaps that have messages)
  useEffect(() => {
    async function fetchChats() {
      try {
        const res = await axios.get(`/api/chats/mine`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setChats(res.data); // assume data = array of { _id, name, lastMessage, … }
      } catch (err) {
        console.error("Failed to load chats:", err);
      }
    }
    fetchChats();
  }, []);

  return (
    <div className="chats-page">
      {/* ───── Left column: list of chats ───── */}
      <div className="chat-list">
        {/* <h3>My Chats</h3> */}
        {chats.map((swap) => {
          const count = unreadCounts[swap._id] || 0;
          const offeredBook = swap.offeredBook?.title || "❓";
          const requestedBook = swap.requestedBook?.title || "❓";

          return (
            <div
              key={swap._id}
              onClick={() => navigate(`/chats/${swap._id}`)}
              className={`chat-item ${
                swap._id === activeSwapId ? "active" : ""
              }`}
            >
              <span className="chat-label">
                {offeredBook} ⇄ {requestedBook}
              </span>
              {count > 0 && <span className="chat-badge">{count}</span>}
            </div>
          );
        })}
      </div>

      {/* ───── Right column: the ChatWindow (or placeholder) ───── */}
      <div className="chat-window">
        {swapId ? (
          <>
            <SVGBackgroundGrid animate={false} />
            <ChatWindow swapId={swapId} />
          </>
        ) : (
          <div className="placeholder">
            <SVGBackgroundGrid animate={true} />
          </div>
        )}
      </div>
    </div>
  );
}
