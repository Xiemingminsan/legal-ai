// src/routes/docAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const axios = require('axios');
const Document = require('../models/Document');

// POST /api/documents/summarize
router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { docId, mode } = req.body;
    console.log('performSummarization1', mode);
    // mode can be "summary" or "keypoints" or something

    if (!docId) {
      return res.status(400).json({ msg: 'docId is required' });
    }

    // Check if doc belongs to user (unless admin)
    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ msg: 'Document not found' });
    if (req.user.role !== 'admin' && doc.uploaderId.toString() !== req.user.userId) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // Make request to Python microservice
    const response = await axios.post(`${aiServiceUrl}/summarize_doc`, {
      docId,
      mode // "summary" or "keypoints"
    }, {
      headers: { 'Content-Type': 'application/json' },
    });

    // Return the result to the frontend
    res.json(response.data);

  } catch (err) {
    console.error('Error in docAnalysisRoutes /summarize:', err.message);
    res.status(500).json({ msg: 'Server error in summarizing document' });
  }
});

module.exports = router;
