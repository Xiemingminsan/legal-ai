// src/routes/chatRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const ChatHistory = require('../models/ChatHistory');
const axios = require('axios');

const router = express.Router();

// GET /api/chat/history - get all conversation entries for this user
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chatRecords = await ChatHistory.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(chatRecords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/chat/message - add a new user message
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { conversationId, userMessage } = req.body;

    let chat;
    if (!conversationId) {
      // create new conversation
      chat = new ChatHistory({
        userId: req.user.userId,
        conversation: [{ role: 'user', text: userMessage }],
      });
    } else {
      // update existing conversation
      chat = await ChatHistory.findById(conversationId);
      if (!chat) {
        return res.status(404).json({ msg: 'Conversation not found' });
      }
      if (chat.userId.toString() !== req.user.userId) {
        return res.status(403).json({ msg: 'Not authorized' });
      }
      chat.conversation.push({ role: 'user', text: userMessage });
    }

    await chat.save();
    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/chat/assistant - store an assistant’s reply (placeholder for now)
router.post('/assistant', authMiddleware, async (req, res) => {
  try {
    const { conversationId, assistantMessage } = req.body;

    const chat = await ChatHistory.findById(conversationId);
    if (!chat) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    if (chat.userId.toString() !== req.user.userId) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    chat.conversation.push({ role: 'assistant', text: assistantMessage });
    await chat.save();

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const chatConversations = await ChatHistory.find({ userId: req.user.userId }).sort({ createdAt: -1 });

    if (!chatConversations || chatConversations.length === 0) {
      return res.status(404).json({ msg: 'No conversations found' });
    }

    res.json(chatConversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/ask-ai', authMiddleware, async (req, res) => {
  try {
    const { query } = req.body;
    const aiServiceUrl = process.env.AI_SERVICE_URL;

    const response = await axios.post(`${aiServiceUrl}/qa`, {
      query: query,
      top_k: 3
    });

    // response.data will have { answer, chunksUsed }
    const aiAnswer = response.data.answer;

    // If you want, store it in ChatHistory:
    // e.g., conversationId, userMessage => user, AI => assistant
    // For now just return the AI answer
    return res.json({ answer: aiAnswer });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: 'Error calling AI service' });
  }
});


module.exports = router;