const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const axios = require('axios');
const ChatHistory = require('../models/ChatHistory');
router.post('/ask-ai', authMiddleware, async (req, res) => {
    try {
      const { query, conversationId, language } = req.body;
      const userId = req.user.userId;
  
      if (!query || !query.trim()) {
        return res.status(400).json({ msg: 'Query cannot be empty' });
      }
  
      // Retrieve or create conversation
      let conversation = conversationId
        ? await ChatHistory.findById(conversationId)
        : new ChatHistory({ userId, conversation: [], summary: "", chunksUsed: [] });
  
      if (!conversation) {
        return res.status(404).json({ msg: 'Conversation not found.' });
      }
      if (conversation.userId.toString() !== userId) {
        return res.status(403).json({ msg: 'You are not authorized to access this conversation.' });
      }
  
      // Add user query to the conversation
      conversation.conversation.push({ role: 'user', text: query });
  
      // Update summary if needed
      if (conversation.conversation.length % 10 === 0) {
        try {
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
          const summaryResponse = await axios.post(
            `${aiServiceUrl}/summarize`,
            new URLSearchParams({ conversationText: conversation.conversation.map(msg => `${msg.role}: ${msg.text}`).join("\n") }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          conversation.summary = summaryResponse.data.summary || conversation.summary;
        } catch (error) {
          console.error('Error summarizing conversation:', error.message);
        }
      }
  
      // Build context: summary + last 5 messages
      const context = (conversation.summary ? conversation.summary + "\n" : "") +
        conversation.conversation.slice(-20).map(msg => `${msg.role}: ${msg.text}`).join("\n") +
        conversation.chunksUsed.slice(-5).map(chunk => `Chunk from doc ${chunk.doc_id}:\n${chunk.text}\n`);
  
      // Call AI service
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const aiResponse = await axios.post(
          `${aiServiceUrl}/qa`,
          new URLSearchParams({ language, query, context, top_k: 10 }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
  
        const aiAnswer = aiResponse.data.answer;
        const usedChunks = aiResponse.data.chunksUsed || [];
        conversation.conversation.push({ role: 'assistant', text: aiAnswer });

        // Append used chunks to chunksUsed and maintain maximum of 50
        if (usedChunks.length > 0) {
          conversation.chunksUsed = [...conversation.chunksUsed, ...usedChunks];

          // Ensure only the last 50 chunks are kept
          if (conversation.chunksUsed.length > 50) {
              conversation.chunksUsed = conversation.chunksUsed.slice(-50);
          }
      }
      } catch (error) {
        console.error('Error calling AI service:', error.message);
        return res.status(500).json({ msg: 'Failed to communicate with AI service.' });
      }
  
      // Save the conversation (once at the end)
      await conversation.save();
  
      // Return the updated conversation
      res.json({
        conversationId: conversation._id,
        conversation: conversation.conversation,
      });
    } catch (error) {
      console.error('Error in /ask-ai:', error.message);
      res.status(500).json({ msg: 'Server error in AI communication' });
    }
  });
  

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversations = await ChatHistory.find({ userId: userId }).sort({ createdAt: -1 });
        res.json(conversations);
    } catch (error) {
        console.error('Error fetching chat history:', error.message);
        res.status(500).json({ msg: 'Server error fetching chat history' });
    }
});

router.post('/new', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const conversation = new ChatHistory({
        userId,
        conversation: [],
        summary: ''
      });
      await conversation.save();
      res.json({ conversationId: conversation._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Failed to create a new conversation' });
    }
  });

router.post('/:conversationId/save-message', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role, text } = req.body;
    const conversation = await ChatHistory.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: 'Conversation not found' });

    conversation.conversation.push({ role, text });
    await conversation.save();
    res.json({ msg: 'Message saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Failed to save message' });
  }
});

module.exports = router;
