const mongoose = require('mongoose');

const BotSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  icon: {
    type: String,
    default: 'default.png'
  },
  type: {
    type: String,
    enum: ['primary', 'custom', 'private'],
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  systemPrompt: {
    type: String,
    required: true
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  categories: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bot', BotSchema);