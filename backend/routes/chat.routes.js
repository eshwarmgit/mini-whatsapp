import express from "express";
import Message from "../models/message.js";
import User from "../models/user.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Send message (1-to-1)
router.post("/send", auth, async (req, res) => {
  try {
    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ error: "Receiver and content are required" });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver,
      content: content.trim()
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "username name")
      .populate("receiver", "username name");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages (1-to-1)
router.get("/messages/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
      .populate("sender", "username name")
      .populate("receiver", "username name")
      .sort({ createdAt: 1 });

    // Filter deleted messages
    const filteredMessages = messages.map(msg => {
      if (msg.deletedForEveryone) {
        return {
          ...msg.toObject(),
          content: "This message was deleted",
          isDeleted: true
        };
      }
      if (msg.deletedFor.includes(currentUserId)) {
        return {
          ...msg.toObject(),
          content: "This message was deleted",
          isDeleted: true
        };
      }
      return msg;
    });

    res.json(filteredMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message for me
router.patch("/delete-for-me/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message for everyone
router.patch("/delete-for-everyone/:messageId", auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can delete for everyone
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: "Only sender can delete for everyone" });
    }

    message.deletedForEveryone = true;
    await message.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

