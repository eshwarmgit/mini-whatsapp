import jwt from "jsonwebtoken";
import Message from "./models/message.js";
import User from "./models/user.js";
import Group from "./models/group.js";

export default function socketHandler(io) {
  // Store typing indicators: { userId: { chatId: timestamp } }
  const typingUsers = {};

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { 
      online: true,
      lastSeen: new Date()
    });

    // Emit online status to all
    io.emit("user-online", { userId: socket.userId });

    // Join user's personal room (convert to string for consistency)
    const userIdStr = String(socket.userId);
    socket.join(userIdStr);

    // Join all groups user is member of
    const groups = await Group.find({ members: socket.userId });
    groups.forEach(group => {
      socket.join(String(group._id));
    });

    // ========== 1-to-1 MESSAGING ==========

    // Send 1-to-1 message
    socket.on("send-message", async (data) => {
      try {
        const { receiver, content } = data;

        if (!receiver || !content) {
          return socket.emit("error", { message: "Receiver and content required" });
        }

        const message = await Message.create({
          sender: socket.userId,
          receiver,
          content: content.trim()
        });

        const populated = await Message.findById(message._id)
          .populate("sender", "username name")
          .populate("receiver", "username name");

        // Send to receiver (convert IDs to strings for comparison)
        const receiverId = String(receiver);
        const senderId = String(socket.userId);
        
        // Send to receiver's room
        io.to(receiverId).emit("receive-message", populated);
        // Send confirmation to sender
        socket.emit("message-sent", populated);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ========== GROUP MESSAGING ==========

    // Join group room
    socket.on("join-group", async (groupId) => {
      try {
        const group = await Group.findById(groupId);
        if (!group) {
          return socket.emit("error", { message: "Group not found" });
        }

        const isMember = group.members.some(
          m => m.toString() === socket.userId
        );

        if (!isMember) {
          return socket.emit("error", { message: "Not a member of this group" });
        }

        socket.join(groupId);
        console.log(`User ${socket.username} joined group ${groupId}`);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Leave group room
    socket.on("leave-group", (groupId) => {
      socket.leave(groupId);
      console.log(`User ${socket.username} left group ${groupId}`);
    });

    // Send group message
    socket.on("send-group-message", async (data) => {
      try {
        const { groupId, content } = data;

        if (!groupId || !content) {
          return socket.emit("error", { message: "GroupId and content required" });
        }

        // Verify user is member
        const group = await Group.findById(groupId);
        if (!group) {
          return socket.emit("error", { message: "Group not found" });
        }

        const isMember = group.members.some(
          m => m.toString() === socket.userId
        );

        if (!isMember) {
          return socket.emit("error", { message: "Not a member of this group" });
        }

        const message = await Message.create({
          sender: socket.userId,
          groupId,
          content: content.trim()
        });

        const populated = await Message.findById(message._id)
          .populate("sender", "username name");

        // Emit to all group members
        io.to(groupId).emit("receive-group-message", populated);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ========== TYPING INDICATORS ==========

    socket.on("typing-start", (data) => {
      const { chatId, isGroup } = data;
      if (!typingUsers[socket.userId]) {
        typingUsers[socket.userId] = {};
      }
      typingUsers[socket.userId][chatId] = Date.now();

      if (isGroup) {
        socket.to(chatId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          chatId,
          isTyping: true
        });
      } else {
        io.to(chatId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          chatId,
          isTyping: true
        });
      }
    });

    socket.on("typing-stop", (data) => {
      const { chatId, isGroup } = data;
      if (typingUsers[socket.userId]) {
        delete typingUsers[socket.userId][chatId];
      }

      if (isGroup) {
        socket.to(chatId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          chatId,
          isTyping: false
        });
      } else {
        io.to(chatId).emit("user-typing", {
          userId: socket.userId,
          username: socket.username,
          chatId,
          isTyping: false
        });
      }
    });

    // ========== MESSAGE DELETION ==========

    socket.on("delete-message-for-me", async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        if (!message.deletedFor.includes(socket.userId)) {
          message.deletedFor.push(socket.userId);
          await message.save();
        }

        socket.emit("message-deleted", { messageId, deletedFor: "me" });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("delete-message-for-everyone", async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (!message) {
          return socket.emit("error", { message: "Message not found" });
        }

        if (message.sender.toString() !== socket.userId) {
          return socket.emit("error", { message: "Only sender can delete for everyone" });
        }

        message.deletedForEveryone = true;
        await message.save();

        // Emit to all relevant users
        if (message.groupId) {
          io.to(message.groupId.toString()).emit("message-deleted", {
            messageId,
            deletedFor: "everyone"
          });
        } else {
          io.to(message.receiver.toString()).emit("message-deleted", {
            messageId,
            deletedFor: "everyone"
          });
          socket.emit("message-deleted", {
            messageId,
            deletedFor: "everyone"
          });
        }
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // ========== DISCONNECT ==========

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${socket.username}`);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        online: false,
        lastSeen: new Date()
      });

      // Clean up typing indicators
      delete typingUsers[socket.userId];

      // Emit offline status
      io.emit("user-offline", { userId: socket.userId });
    });
  });
}
