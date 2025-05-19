import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?._id && !socketRef.current) {
      socketRef.current = io("http://localhost:6969");

      socketRef.current.on("connect", () => {
        console.log("🌐 Global socket connected:", socketRef.current.id);
        socketRef.current.emit("register", user._id);
      });

      socketRef.current.on("newMessage", (msg) => {
        console.log("📨 Global socket caught a message:", msg);
      });

      window.socket = socketRef.current; // optional for debugging
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?._id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
