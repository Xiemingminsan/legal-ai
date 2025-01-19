  // src/models/Document.js
  const mongoose = require('mongoose');

  const DocumentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    filePath: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    processingError: { type: String, default: null },
    processingProgress: { type: Number, default: 0 },
    category: { type: String, default: 'uncategorized' },
    docScope: {
      type: String,
      enum: ['private', 'public'],
      default: 'public'
    },
    language: { type: String, enum:['en','amh'], default: 'en' },
    uploadDate: { type: Date, default: Date.now }
  });

  module.exports = mongoose.model('Document', DocumentSchema);
