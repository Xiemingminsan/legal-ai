// src/routes/botRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const Bot = require("../models/Bot");
const Document = require("../models/Document");
const { uploadDocument } = require("../helpers/utils");

//Add bots
const multer = require("multer");
const path = require("path");
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

router.post("/add", authMiddleware, upload.array("files"), async (req, res) => {
  try {
    console.log("req.body", req.body);
    let { name, description, icon, visibility, systemPrompt, documentIds, categories } =
      req.body;
    const metadata = JSON.parse(req.body.metadata || "[]");

    if (!name || !description || !req.files?.length) {
      return res.status(400).json({ msg: "Missing required fields" });
    }
    let type;

    if (visibility === "private") {
      type = "private";
    } else if (visibility === "public" && req.user.role === "admin") {
      visibility = "primary";
      type = "primary";
    } else {
      type = "public";
    }

    // Create bot
    const parsedCategories = categories ? categories.split(",").map(cat => cat.trim()) : [];
    const bot = new Bot({
      name,
      description,
      icon,
      visibility,
      systemPrompt,
      type,
      creator: req.user.userId,
      categories: parsedCategories,
    });

    await bot.save();
    console.log("Bot created:", bot);

    // Process each file
    const results = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        const fileMetadata = metadata[i];
        console.log("Docccc ", i, metadata[i]);

        const result = await uploadDocument(
          file,
          {
            bot_id: bot._id,
            title: fileMetadata.title,
            category: fileMetadata.category,
            docScope: fileMetadata.docScope,
            language: fileMetadata.language,
          },
          req.user.userId
        );

        bot.documents.push(result.docId);
        results.push(result);
      } catch (error) {
        if (error instanceof AggregateError) {
          console.log("AggregateError:", error.message);
          error.errors.forEach((e, index) => console.log(`Error ${index + 1}:`, e.message));
        } else {
          console.error(error);
        }
        errors.push({
          file: req.files[i].originalname,
          error: error.message,
        });
      }
    }

    // Parse and add documentIds if provided
    if (documentIds) {
      try {
        const parsedDocumentIds = JSON.parse(documentIds);
        if (Array.isArray(parsedDocumentIds)) {
          bot.documents.push(...parsedDocumentIds);
        } else {
          return res.status(400).json({ msg: "Invalid format for documentIds" });
        }
      } catch (error) {
        return res.status(400).json({ msg: "Error parsing documentIds" });
      }
    }
    await bot.save();

    res.status(201).json({
      bot,
      results,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("Error creating bot:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

//Get Bots
router.get("/", authMiddleware, async (req, res) => {
  try {
    // Get primary bots
    const primaryBots = await Bot.find({ visibility: "primary" }).populate("documents");

    // Get public custom bots
    const publicCustomBots = await Bot.find({
      visibility: "public",
    }).populate("documents");

    // Get user's private bots
    const privateBots = await Bot.find({
      creator: req.user.userId,
      visibility: "private",
    }).populate("documents");

    console.log("prim", primaryBots, "public", publicCustomBots, "private ", privateBots);

    res.json({
      primary: primaryBots,
      public: publicCustomBots,
      private: privateBots,
    });
  } catch (error) {
    console.error("Error fetching bots:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// Add document to bot
router.post("/:botId/documents", authMiddleware, async (req, res) => {
  try {
    const { botId } = req.params;
    const { documentId } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ msg: "Bot not found" });
    }

    // Check authorization
    if (bot.creator.toString() !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ msg: "Not authorized" });
    }

    // Check if document exists and is accessible
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ msg: "Document not found" });
    }

    // Add document if not already added
    if (!bot.documents.includes(documentId)) {
      bot.documents.push(documentId);
      await bot.save();
    }

    res.json(bot);
  } catch (error) {
    console.error("Error adding document to bot:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// GET /api/bots/:botId
router.get("/:botId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: "Bot not found" });

    if (
      bot.scope === "private" &&
      bot.ownerId.toString() !== userId &&
      userRole !== "admin"
    ) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(bot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching bot" });
  }
});

// PUT /api/bots/:botId
router.put("/:botId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;
    const { title, description, docIds, systemPrompt, scope } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: "Bot not found" });

    // If the user is not the owner or admin, block
    if (bot.ownerId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ msg: "Not authorized to update this bot" });
    }

    // Update fields
    if (title) bot.title = title;
    if (description) bot.description = description;
    if (docIds) bot.docIds = docIds;
    if (systemPrompt !== undefined) bot.systemPrompt = systemPrompt;
    if (scope && (scope === "public" || scope === "private")) {
      bot.scope = scope;
    }

    await bot.save();
    res.json({ bot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error updating bot" });
  }
});

// DELETE /api/bots/:botId
router.delete("/:botId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: "Bot not found" });

    if (bot.ownerId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ msg: "Not authorized to delete this bot" });
    }

    await bot.remove();
    res.json({ msg: "Bot deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error deleting bot" });
  }
});

router.get("/bots/:id/documents", authMiddleware, async (req, res) => {
  try {
    const bot = await Bot.findById(req.params.id)
      .select("documents")
      .populate("documents", "id");
    res.json({ documents: bot?.documents || [] });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching bot documents" });
  }
});

module.exports = router;
