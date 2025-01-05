// src/models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filePath: { type: String, required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
  processingError: { type: String, default: null },
  processingProgress: { type: Number, default: 0 }, // New field
  uploadDate: { type: Date, default: Date.now },
},
{ timestamps: true });

module.exports = mongoose.model('Document', DocumentSchema);

// models/Document.js
