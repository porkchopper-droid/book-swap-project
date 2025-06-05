import { createContext, useContext, useReducer, useEffect } from "react";
import { useSocket } from "./SocketContext"; // our existing global socket
import { useParams } from "react-router-dom";
import axios from "axios";

const NotificationContext = createContext();

// Reducer to manage unreadCounts:
// - { [swapId]: count, ... }
function notificationReducer(state, action) {
  switch (action.type) {
    case "SET_ALL": // for hydration 💦
      return action.payload || {};
    case "INCREMENT_UNREAD": {
      const { swapId } = action;
      const prevCount = state[swapId] || 0;
      return { ...state, [swapId]: prevCount + 1 };
    }
    case "CLEAR_UNREAD": {
      const { swapId } = action;
      if (!state[swapId]) return state; // nothing to do
      // Make a shallow copy and remove that key
      const newState = { ...state };
      delete newState[swapId];
      return newState;
    }
    case "RESET_ALL": {
      return {}; // wipe all unread counts (e.g. on logout)
    }
    default:
      return state;
  }
}

export function NotificationProvider({ children }) {
  const socket = useSocket();
  const [unreadCounts, dispatch] = useReducer(notificationReducer, {});

  // We need to know: “Which chat is open right now?” so we can skip incrementing
  // when the user is already in that chat.
  //
  const params = useParams();
  // If the URL is /chats/:swapId, then params.swapId is the open chat
  const activeSwapId = params.swapId || null;

  // 💦 Hydrate from backend when provider first mounts
  useEffect(() => {
    const loadInitialUnreadCounts = async () => {
      try {
        const res = await axios.get("/api/notifications/unreadCounts", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        dispatch({ type: "SET_ALL", payload: res.data });
      } catch (err) {
        console.error("Failed to load initial unread counts:", err);
      }
    };

    loadInitialUnreadCounts();
  }, []); // 🔥 empty deps = run once on first mount

  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(msg) {
      const incomingSwapId = String(msg.swapId);

      // If the user is *not* currently viewing this swap, increment unread.
      if (incomingSwapId !== activeSwapId) {
        dispatch({ type: "INCREMENT_UNREAD", swapId: incomingSwapId });
      }
      // If it *is* activeSwapId, we do nothing here. ChatWindow itself
      // is already rendering the new message in real time.
    }

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, activeSwapId]);

  // Exposed functions:
  const incrementUnread = (swapId) => {
    dispatch({ type: "INCREMENT_UNREAD", swapId: String(swapId) });
  };

  const clearUnread = async (swapId) => {
    dispatch({ type: "CLEAR_UNREAD", swapId: String(swapId) });
    try {
      await axios.patch(`/api/notifications/clearUnread/${swapId}`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (err) {
      console.error("Failed to clear unread count on server:", err);
    }
  };

  const resetAll = () => {
    dispatch({ type: "RESET_ALL" });
  };

  return (
    <NotificationContext.Provider
      value={{ unreadCounts, incrementUnread, clearUnread, resetAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook for consuming the context
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
