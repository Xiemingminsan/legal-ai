const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const axios = require('axios');
const ChatHistory = require('../models/ChatHistory');

router.post('/ask-ai', authMiddleware, async (req, res) => {
    try {
        const { query, conversationId } = req.body;
        const userId = req.user.userId;

        console.log('User query:', query);

        if (!query || !query.trim()) {
            return res.status(400).json({ msg: 'ya, Query cannot be empty' });
        }

        // Find or create a conversation
        let conversation;
        if (conversationId) {
            conversation = await ChatHistory.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ msg: 'Conversation not found' });
            }
            if (conversation.userId.toString() !== userId) {
                return res.status(403).json({ msg: 'Not authorized' });
            }
        } else {
            conversation = new ChatHistory({
                userId: userId,
                conversation: []
            });
        }

        // Add user message to conversation
        conversation.conversation.push({ role: 'user', text: query });

        await conversation.save();

        // Prepare data for AI microservice
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        console.log('AI service URL:', aiServiceUrl);
        const aiEndpoint = `${aiServiceUrl}/qa`;

        // Send query to AI microservice
        const aiResponse = await axios.post(aiEndpoint, new URLSearchParams({
            query: query,
            top_k: 3
        }), {
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            }
        });

        const aiAnswer = aiResponse.data.answer;

        // Add AI response to conversation
        conversation.conversation.push({ role: 'assistant', text: aiAnswer });

        await conversation.save();

        // Return the updated conversation
        res.json({
            conversationId: conversation._id,
            conversation: conversation.conversation
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

module.exports = router;
