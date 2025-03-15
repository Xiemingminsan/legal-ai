// src/routes/docRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
const Document = require("../models/Document");
const FormData = require("form-data"); // Add this line
const fs = require("fs"); // To check file existence
const { uploadDocument } = require("../helpers/utils");
const Contract = require("../models/Contract");

const router = express.Router();

// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder for uploaded files
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
});

router.post("/upload", authMiddleware, upload.array("files", 1000), async (req, res) => {
  try {
    const files = req.files; // Array of uploaded files
    const metadata = JSON.parse(req.body.metadata); // Parse metadata from JSON string

    if (!files || files.length === 0) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    if (!metadata || metadata.length !== files.length) {
      return res
        .status(400)
        .json({ msg: "Metadata count must match the number of files uploaded" });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileMetadata = metadata[i];

      try {
        // Pass metadata for each file to the uploadDocument function
        const result = await uploadDocument(file, fileMetadata, req.user.userId);
        results.push(result);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error.message);
        errors.push({
          file: file.originalname,
          error: error.message,
        });
      }
    }

    res.json({
      msg: errors.length
        ? "Some files failed to process"
        : "All files processed successfully",
      results,
      errors,
    });
  } catch (error) {
    console.error("Upload error:", error.message);
    res.status(500).json({ msg: error.message });
  }
});

//@todo: added this here feb 9
// GET /api/documents/getContracts
router.get("/getContracts", authMiddleware, async (req, res) => {
  try {
    const contracts = await Contract.find();

    // Check if contracts are found
    if (!contracts) {
      return res.status(404).json({ msg: "No Contracts found" });
    }

    // Return the list of users
    res.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error.message);
    res.status(500).json({ msg: "Server error fetching contracts" });
  }
});

// GET /api/documents
router.get("/", authMiddleware, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { uploaderId: req.user.userId };

    const docs = await Document.find({ ...query, docScope: { $ne: "private" } }).sort({ uploadDate: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/documents/:id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;
    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    res.json(document);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/documents/:id/status
router.get("/:id/status", authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;

    // Validate docId format
    if (!docId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ msg: "Invalid document ID format." });
    }

    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ msg: "Document not found." });
    }

    res.json({ status: document.status });
  } catch (err) {
    console.error("Status fetch error:", err);
    res.status(500).json({ msg: "Server error while fetching status." });
  }
});

// DELETE /api/documents/deleteAll
router.delete("/deleteAll", async (req, res) => {
  try {
    // Find all documents to get file paths
    const documents = await Document.find({});
    const filePaths = documents.map((doc) => doc.filePath);

    // Delete files from the server
    for (const filePath of filePaths) {
      const fullPath = path.resolve(filePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath); // Synchronously delete the file
        } catch (error) {
          console.error(`Error deleting file at ${fullPath}:`, error);
        }
      }
    }

    // Delete all documents from the database
    await Document.deleteMany({});

    res.json({ msg: "All documents and their files have been deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/documents/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId);

    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }

    // If not admin, ensure the doc belongs to the user
    if (req.user.role !== "admin" && doc.uploaderId.toString() !== req.user.userId) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // Delete the file from the server
    const fullPath = path.resolve(doc.filePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (error) {
        console.error(`Error deleting file at ${fullPath}:`, error);
      }
    }

    // Delete the document record
    await Document.deleteOne({ _id: docId });

    res.json({ msg: "Document deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
