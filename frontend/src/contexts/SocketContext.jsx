import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Track the “live” socket in state so that context re-renders when it’s set.
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only initialize once, when user._id exists and we haven’t yet created a socket
    if (user?._id && !socketRef.current) {
      // Replace URL if your backend lives somewhere else
      const newSocket = io("http://localhost:6969");

      // When the handshake succeeds:
      newSocket.on("connect", () => {
        console.log("🌐 Global socket connected:", newSocket.id);
        newSocket.emit("register", user._id);
      });

      // For debugging—removes the need to check useSocket() in console manually
      window.socket = newSocket;

      // Listen globally for newMessage to see anything at all
      newSocket.on("newMessage", (msg) => {
        console.log("📨 Global socket caught newMessage:", msg);
      });

      // Save into ref and state (causes a re-render so context value updates)
      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    // Cleanup if user logs out or component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
