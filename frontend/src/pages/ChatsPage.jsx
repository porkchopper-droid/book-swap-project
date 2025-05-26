import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";

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
            <p>Select a chat from the list</p>
          </div>
        )}
      </div>
    </div>
  );
}
