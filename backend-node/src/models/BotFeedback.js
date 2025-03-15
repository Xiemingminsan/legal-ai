const mongoose = require('mongoose');

const BotFeedbackSchema = new mongoose.Schema({
  botId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only leave one review per bot
BotFeedbackSchema.index({ botId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('BotFeedback', BotFeedbackSchema);
