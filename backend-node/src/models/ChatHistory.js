// src/models/ChatHistory.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  text: { type: String, required: true },
});

const ChatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  conversation: [ChatMessageSchema], // array of messages
  summary: { type: String, default: '' }, // add summary field
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);
