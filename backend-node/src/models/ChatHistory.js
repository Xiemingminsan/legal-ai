// src/models/ChatHistory.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
});

const ChunkSchema = new mongoose.Schema({
  doc_id: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  conversation: [ChatMessageSchema], // array of messages
  summary: { type: String, default: '' }, // add summary field
  chunksUsed: [ChunkSchema], // add chunksUsed field],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
