import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import axios from "axios";

import "./ChatsPage.scss";

export default function ChatsPage() {
  const { swapId } = useParams();
  const navigate = useNavigate();
  const [activeSwapId, setActiveSwapId] = useState(null);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    if (swapId) setActiveSwapId(swapId); // ✅ Sync URL to state
  }, [swapId]);

  useEffect(() => {
    const fetchChats = async () => {
      const res = await axios.get("/api/chats/mine", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = res.data;
      setChats(data);
    };

    fetchChats();
  }, []);

  return (
    <div className="chats-page">
      <div className="chat-list">
        <h3>My Chats</h3>
        {chats.map((swap) => {
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
              {offeredBook} ⇄ {requestedBook}
            </div>
          );
        })}
      </div>

      <div className="chat-window">
        {swapId ? (
          <ChatWindow swapId={swapId} />
        ) : (
          <div className="placeholder">
            <p>
              No chatter yet! Select a swap to start a conversation and trade
              some stories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
