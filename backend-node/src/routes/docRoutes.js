// src/routes/docRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const axios = require('axios');
const Document = require('../models/Document');
const FormData = require('form-data'); // Add this line
const fs = require('fs'); // To check file existence

const router = express.Router();

// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST /api/documents/uploadconst FormData = require('form-data'); // Ensure to install `form-data` library

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;
    
    // Validation
    if (!title?.trim()) {
      return res.status(400).json({ msg: 'Title is required' });
    }
    
    if (!file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    // Validate file type
    if (!file.mimetype.includes('pdf')) {
      return res.status(400).json({ msg: 'Only PDF files are supported' });
    }
    
    // Create document record
    const newDoc = new Document({
      title,
      filePath: file.path,
      uploaderId: req.user.userId,
      status: 'processing', // Add status field to your schema
      processingError: null
    });
    
    await newDoc.save();
    
    // Process with AI service
    const pdfFullPath = path.resolve(file.path);
    const aiServiceUrl = process.env.AI_SERVICE_URL;
    
    if (!fs.existsSync(pdfFullPath)) {
      newDoc.status = 'failed';
      newDoc.processingError = 'File not found on server';
      await newDoc.save();
      return res.status(400).json({ msg: 'Uploaded file not found on server.' });
    }
    
    // Send initial success response
    res.json({ 
      msg: 'Document upload started', 
      doc: newDoc,
      status: 'processing'
    });
    
    // Process with AI service asynchronously
    try {
      const form = new FormData();
      form.append('doc_id', newDoc._id.toString());
      form.append('pdf_path', pdfFullPath);
      
      const response = await axios.post(`${aiServiceUrl}/embed_document`, form, {
        headers: form.getHeaders(),
        timeout: 300000 // 5 minute timeout
      });
      
      // Update document status on success
      newDoc.status = 'completed';
      newDoc.processingError = null;
      await newDoc.save();
      
      console.log("Document processed successfully:", {
        docId: newDoc._id,
        chunksAdded: response.data.chunks_added
      });
      
    } catch (error) {
      console.error("AI processing failed:", error.message);
      newDoc.status = 'failed';
      newDoc.processingError = error.message;
      await newDoc.save();
    }
    
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents (list user’s docs or all if admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}
      : { uploaderId: req.user.userId };

    const docs = await Document.find(query).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId);

    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // If not admin, ensure the doc belongs to the user
    if (req.user.role !== 'admin' && doc.uploaderId.toString() !== req.user.userId) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Use deleteOne or findByIdAndDelete instead of remove()
    await Document.deleteOne({ _id: docId });

    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/documents/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;
    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/:id/status', authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;

    // Validate docId format (optional but recommended)
    if (!docId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: 'Invalid document ID format.' });
    }

    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ msg: 'Document not found.' });
    }

    res.json({ status: document.status });
  } catch (err) {
    console.error("Status fetch error:", err);
    res.status(500).json({ msg: 'Server error while fetching status.' });
  }
});

module.exports = router;
