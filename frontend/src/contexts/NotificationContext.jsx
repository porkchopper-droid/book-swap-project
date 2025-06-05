import { createContext, useContext, useReducer, useEffect } from "react";
import { useSocket } from "./SocketContext"; // our existing global socket
import { useLocation, useParams } from "react-router-dom";

const NotificationContext = createContext();

// Reducer to manage unreadCounts:
// - { [swapId]: count, ... }
function notificationReducer(state, action) {
  switch (action.type) {
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
  // We can grab the current path or params from react-router. Example:
  const location = useLocation();
  const params = useParams();
  // If the URL is /chats/:swapId, then params.swapId is the open chat
  const activeSwapId = params.swapId || null;

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

  const clearUnread = (swapId) => {
    dispatch({ type: "CLEAR_UNREAD", swapId: String(swapId) });
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