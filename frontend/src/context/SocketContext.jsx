import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token && !socketRef.current) {
      const newSocket = createSocket(token);
      socketRef.current = newSocket;

      newSocket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        setIsConnected(false);
      });

      newSocket.on("error", (error) => {
        console.error("❌ Socket error:", error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        socketRef.current = null;
        setIsConnected(false);
      };
    } else if (!isAuthenticated && socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
  }, [isAuthenticated, token]);

  const value = {
    socket,
    isConnected
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

