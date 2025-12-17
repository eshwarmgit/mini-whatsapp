import "dotenv/config";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import groupRoutes from "./routes/group.routes.js";
import socketHandler from "./socket.js";

const app = express();

/* ---------- Middlewares ---------- */
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

/* ---------- Routes ---------- */
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/groups", groupRoutes);

/* ---------- HTTP Server ---------- */
const server = http.createServer(app);

/* ---------- Socket.IO ---------- */
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

/* ---------- MongoDB Connection ---------- */
mongoose.set("bufferCommands", false);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    // ✅ START SOCKETS ONLY AFTER DB CONNECTS
    socketHandler(io);
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

/* ---------- Server Listen ---------- */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
