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
    filedownloadUrl: { type: String }, // Optional
    processedContent: { type: String } // Optional
  }
});

  const ChunkSchema = new mongoose.Schema({
    doc_id: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
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
  summary: { type: String, default: "" }, // add summary field
  chunksUsed: [ChunkSchema], // add chunksUsed field],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatHistory", ChatHistorySchema);
