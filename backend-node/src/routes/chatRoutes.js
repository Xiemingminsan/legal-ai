const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const axios = require('axios');
const ChatHistory = require('../models/ChatHistory');
router.post('/ask-ai', authMiddleware, async (req, res) => {
    try {
        const { query, conversationId } = req.body;
        const userId = req.user.userId;

        if (!query || !query.trim()) {
            return res.status(400).json({ msg: 'Query cannot be empty' });
        }

        // Retrieve or create conversation
        let conversation;
        if (conversationId) {
            conversation = await ChatHistory.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({ msg: 'Conversation not found.' });
            }
            if (conversation.userId.toString() !== userId) {
                return res.status(403).json({ msg: 'You are not authorized to access this conversation.' });
            }
        } else {
            conversation = new ChatHistory({
                userId: userId,
                conversation: [],
                summary: "" // Initialize the summary
            });
        }

        // Add user message to conversation
        conversation.conversation.push({ role: 'user', text: query });

        // Check if it's time to update the summary
        const shouldUpdateSummary = conversation.conversation.length % 10 === 0;
        console.log(shouldUpdateSummary)

        if (shouldUpdateSummary) {
            // Prepare conversation text for summarization
            const conversationText = conversation.conversation
                .map(msg => `${msg.role}: ${msg.text}`)
                .join("\n");

            // Call the Python API for summarization
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            try {
                const summaryResponse = await axios.post(`${aiServiceUrl}/summarize`,
                    new URLSearchParams({ conversationText: conversationText }), {
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                    });
                const summary = summaryResponse.data.summary;
                if (summary) {
                    conversation.summary = summary; // Update the summary
                }
            } catch (error) {
                console.error('Error calling summarization API:', error.message);
                return res.status(500).json({ msg: 'Failed to summarize conversation.' });
            }
        }

        await conversation.save();

        // Build context: Use current summary and last 5 messages
        const recentMessages = conversation.conversation.slice(-5);
        const contextParts = recentMessages.map(msg => `${msg.role}: ${msg.text}`);
        const context = (conversation.summary ? conversation.summary + "\n" : "") + contextParts.join("\n");

        // Call the AI microservice
        try {
            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const aiEndpoint = `${aiServiceUrl}/qa`;
            const aiResponse = await axios.post(aiEndpoint, new URLSearchParams({
                query: query,
                context: context,
                top_k: 3
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const aiAnswer = aiResponse.data.answer;
            conversation.conversation.push({ role: 'assistant', text: aiAnswer });
        } catch (error) {
            console.error('Error calling AI service:', error.message);
            return res.status(500).json({ msg: 'Failed to communicate with AI service.' });
        }

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
