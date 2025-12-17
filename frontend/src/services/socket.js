import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const createSocket = (token) => {
  return io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ["websocket", "polling"]
  });
};
