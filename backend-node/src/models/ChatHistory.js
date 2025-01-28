// src/models/ChatHistory.js
const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "bot"], required: true },
  text: { type: String, required: true },
  fileTextContent: { type: String,default: "" },
  timestamp: { type: Date, default: Date.now },
  file: {
    filename: { type: String }, // Optional
    filetype: { type: String }, // Optional
    fileSize: { type: Number }, // Optional
    filedownloadUrl: { type: String } // Optional
  }
});


const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bot",
  },
  conversation: [ChatMessageSchema], // array of messages
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
