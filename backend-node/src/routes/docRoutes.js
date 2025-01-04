// src/routes/docRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middlewares/authMiddleware');
const Document = require('../models/Document');

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

// POST /api/documents/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ msg: 'Title is required' });
    }

    if (!file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const newDoc = new Document({
      title,
      filePath: file.path,
      uploaderId: req.user.userId,
    });

    await newDoc.save();

    res.json({ msg: 'Document uploaded successfully', doc: newDoc });
  } catch (err) {
    console.error(err);
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


module.exports = router;
