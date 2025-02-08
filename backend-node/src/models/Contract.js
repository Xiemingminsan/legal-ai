const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contract', ContractSchema);
