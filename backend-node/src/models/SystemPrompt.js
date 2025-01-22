const mongoose = require('mongoose');

const systemPromptSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true,
    default: "You are a helpful AI assistant to provide Ethiopian Law based legal advice and information."
  }
});

const SystemPrompt = mongoose.model('SystemPrompt', systemPromptSchema);

module.exports = SystemPrompt;
