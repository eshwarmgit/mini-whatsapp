import express from "express";
import Group from "../models/group.js";
import Message from "../models/message.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Create group
router.post("/create", auth, async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ error: "Name and members array are required" });
    }

    // Add creator to members if not included
    const allMembers = [...new Set([req.user.id, ...members])];

    const group = await Group.create({
      name,
      members: allMembers,
      admin: req.user.id
    });

    const populated = await Group.findById(group._id)
      .populate("members", "username name")
      .populate("admin", "username name");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my groups
router.get("/my", auth, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user.id
    })
      .populate("members", "username name")
      .populate("admin", "username name")
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group by ID
router.get("/:groupId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate("members", "username name")
      .populate("admin", "username name");

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is member
    const isMember = group.members.some(
      member => member._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get group messages
router.get("/:groupId/messages", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    // Check if user is member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.members.some(
      member => member.toString() === currentUserId
    );

    if (!isMember) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    const messages = await Message.find({ groupId })
      .populate("sender", "username name")
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

// Add members to group
router.patch("/:groupId/add-members", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { members } = req.body;

    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ error: "Members array is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only admin can add members
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only admin can add members" });
    }

    // Add new members (avoid duplicates)
    const existingMembers = group.members.map(m => m.toString());
    const newMembers = members.filter(m => !existingMembers.includes(m));
    group.members.push(...newMembers);
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("members", "username name")
      .populate("admin", "username name");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from group
router.patch("/:groupId/remove-member", auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Only admin can remove members
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only admin can remove members" });
    }

    // Cannot remove admin
    if (memberId === group.admin.toString()) {
      return res.status(400).json({ error: "Cannot remove admin" });
    }

    group.members = group.members.filter(
      m => m.toString() !== memberId
    );
    await group.save();

    const populated = await Group.findById(groupId)
      .populate("members", "username name")
      .populate("admin", "username name");

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave group
router.patch("/:groupId/leave", auth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Cannot leave if you're the admin
    if (group.admin.toString() === req.user.id) {
      return res.status(400).json({ error: "Admin cannot leave group. Transfer admin first." });
    }

    group.members = group.members.filter(
      m => m.toString() !== req.user.id
    );
    await group.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

