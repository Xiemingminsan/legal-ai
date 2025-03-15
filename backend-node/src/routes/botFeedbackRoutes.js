// src/routes/botFeedbackRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const BotFeedback = require('../models/BotFeedback');
const Bot = require('../models/Bot');

// Submit feedback for a bot
router.post('/:botId', authMiddleware, async (req, res) => {
  try {
    const { botId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if bot exists
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ msg: 'Bot not found' });
    }

    // Check if user has already submitted feedback for this bot
    let feedback = await BotFeedback.findOne({ botId, userId });
    
    if (feedback) {
      // Update existing feedback
      feedback.rating = rating;
      feedback.comment = comment || '';
      await feedback.save();
      return res.json({ msg: 'Feedback updated successfully', feedback });
    } else {
      // Create new feedback
      feedback = new BotFeedback({
        botId,
        userId,
        rating,
        comment: comment || ''
      });
      await feedback.save();
      return res.status(201).json({ msg: 'Feedback submitted successfully', feedback });
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get all feedback for a bot
router.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    
    // Get all feedback for this bot
    const feedback = await BotFeedback.find({ botId })
      .populate('userId', 'username fullname')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    const totalRatings = feedback.length;
    const averageRating = totalRatings > 0 
      ? feedback.reduce((sum, item) => sum + item.rating, 0) / totalRatings 
      : 0;
    
    return res.json({ 
      feedback,
      stats: {
        totalRatings,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete feedback (only for admin or the user who created it)
router.delete('/:feedbackId', authMiddleware, async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const userId = req.user.userId;
    const isAdmin = req.user.role === 'admin';
    
    const feedback = await BotFeedback.findById(feedbackId);
    if (!feedback) {
      return res.status(404).json({ msg: 'Feedback not found' });
    }
    
    // Check if user is authorized to delete this feedback
    if (!isAdmin && feedback.userId.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    await feedback.remove();
    return res.json({ msg: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;