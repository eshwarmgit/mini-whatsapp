import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group"
  },
  content: {
    type: String,
    required: true
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  deletedForEveryone: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
