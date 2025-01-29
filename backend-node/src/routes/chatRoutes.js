const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
const ChatHistory = require("../models/ChatHistory");
const Bot = require("../models/Bot");
const SharedConversation = require("../models/SharedConversation");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const { Types, Schema } = mongoose;

// Pdf parser
const pdf = require("pdf-parse");

const parsePDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text; // Extracted text from PDF
  } catch (error) {
    console.error("Error parsing PDF:", error);
    return null;
  }
};
// TXT Parser
const fs = require("fs");

const parseTXT = (filePath) => {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return text; // Extracted text from TXT
  } catch (error) {
    console.error("Error parsing TXT:", error);
    return null;
  }
};
// Word Parser
const mammoth = require("mammoth");

const parseWord = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value; // Extracted text from Word
  } catch (error) {
    console.error("Error parsing Word file:", error);
    return null;
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/userChatUpload/"); // Save files in this directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
  },
});

// File filter to allow specific file types (optional)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]; // Example allowed types
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });

//@todo error txt file error catching can't read
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Handle multer errors (e.g., file size limits)
    return res.status(400).json({ msg: "File upload error: " + err.message });
  } else if (err.message.startsWith("Unsupported file type")) {
    // Handle custom file type errors
    return res.status(400).json({ msg: err.message });
  } else {
    // Handle other errors
    return res.status(500).json({ msg: "Internal server error" });
  }
});

router.post("/ask-ai", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { query, conversationId, language } = req.body;
    const userId = req.user.userId;

    if (!query) {
      return res.status(400).json({ msg: "Query cannot be empty" });
    }

    // Initialize fileMetadata as null
    let fileMetadata = null;
    let fileTextContent = null;

    // Check if a file was uploaded
    if (req.file) {
      const { filename, mimetype, size, path: filePath } = req.file;

      // Convert file size from bytes to MB
      const fileSizeInMB = (size / 1048576).toFixed(2); // Convert to MB and round to 2 decimal places

      // Extract file metadata
      fileMetadata = {
        filename: filename, // Name of the file
        filetype: mimetype, // MIME type of the file
        fileSize: fileSizeInMB, // Size of the file in bytes
        filedownloadUrl: `uploads/userChatUpload/${filename}`, // URL to access the file
      };

      console.log("File uploaded:", fileMetadata);

      // Extract text content based on file type
      if (mimetype === "application/pdf") {
        fileTextContent = await parsePDF(filePath);
      } else if (mimetype === "text/plain") {
        fileTextContent = parseTXT(filePath);
      } else if (
        mimetype ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/msword"
      ) {
        fileTextContent = await parseWord(filePath);
      } else if (mimetype.startsWith("image/")) {
        fileTextContent = "Image file Fix meee"; //@todo
        console.log("Image file detected. Skipping text extraction for now. @todo");
      } else {
        return res.status(400).json({
          msg: "Unsupported file type" + mimetype,
        });
      }

      if (fileTextContent) {
        console.log("Extracted text content:", fileTextContent);
      }

      // Check if fileTextContent exceeds 500 characters
      if (fileTextContent && fileTextContent.length > 500) {
        console.log("File text content exceeds the limit of 500 characters.");
        return res.status(400).json({
          msg: "File text content exceeds the limit of 500 characters.",
        });
      }
    }

    // Initialize conversation
    let conversation;

    if (conversationId) {
      conversation = await ChatHistory.findOne({ _id: conversationId, userId });
      if (!conversation) {
        return res.status(404).json({ msg: "Conversation not found" });
      }
    } else {
      // Create new conversation if no conversationId provided
      conversation = new ChatHistory({
        userId,
        conversation: [],
        chunksUsed: [],
        summary: "",
      });
    }

    // Find bot and verify it exists
    const bot = await Bot.findById(conversation.botId).populate("documents");
    if (!bot) {
      return res.status(404).json({ msg: "Bot not found" });
    }

    const botContext = bot.systemPrompt ? bot.systemPrompt + "\n\n" : "";

    // Add user query to the conversation
    conversation.conversation.push({
      role: "user",
      text: query,
      fileTextContent: fileTextContent,
      file: fileMetadata,
    });

    // Update summary if needed
    if (conversation.conversation.length % 10 === 0) {
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
        const summaryResponse = await axios.post(
          `${aiServiceUrl}/summarize`,
          new URLSearchParams({
            conversationText: conversation.conversation
              .map((msg) => `${msg.role}: ${msg.text}`)
              .join("\n"),
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        if (summaryResponse.data && summaryResponse.data.summary) {
          conversation.summary = summaryResponse.data.summary;
        }
      } catch (error) {
        console.error("Error summarizing conversation:", error.message);
        // Continue execution even if summary fails
      }
    }

    // Build context: summary + last messages + recent chunks
    const context = [
      conversation.summary,
      ...conversation.conversation.slice(-20).map((msg) => `${msg.role}: ${msg.text}`),
      ...conversation.chunksUsed
        .slice(-5)
        .map((chunk) => `Chunk from doc ${chunk.doc_id}:\n${chunk.text}`),
    ]
      .filter(Boolean)
      .join("\n");

    // Call AI service
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
      const aiResponse = await axios.post(
        `${aiServiceUrl}/qa`,
        new URLSearchParams({
          language: language || "en",
          query,
          context,
          bot_id: bot._id.toString(),
          top_k: "10",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (!aiResponse.data || !aiResponse.data.answer) {
        throw new Error("Invalid response from AI service");
      }

      const aiAnswer = aiResponse.data.answer;
      const usedChunks = aiResponse.data.chunksUsed || [];

      conversation.conversation.push({
        role: "bot",
        text: aiAnswer,
      });

      // Update chunks used
      if (usedChunks.length > 0) {
        conversation.chunksUsed = [...conversation.chunksUsed, ...usedChunks].slice(-50); // Keep only last 50 chunks
      }

      // Save the conversation
      await conversation.save();

      return res.json({
        conversationId: conversation._id,
        conversation: conversation.conversation,
      });
    } catch (error) {
      console.error("Error calling AI service:", error.message);
      return res.status(500).json({
        msg: "Failed to communicate with AI service.",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error in /ask-ai:", error.message);
    return res.status(500).json({
      msg: "Server error in AI communication",
      error: error.message,
    });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await ChatHistory.find({ userId: userId })
      .sort({ createdAt: -1 })
      .select("-conversation -chunksUsed");

    // const ChatHistorySchema = new mongoose.Schema({
    //   userId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    //   conversation: [ChatMessageSchema], // array of messages
    //   summary: { type: String, default: "" }, // add summary field
    //   chunksUsed: [ChunkSchema], // add chunksUsed field],
    //   createdAt: {
    //     type: Date,
    //     default: Date.now,
    //   },
    // });
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching chat history:", error.message);
    res.status(500).json({ msg: "Server error fetching chat history" });
  }
});

router.post("/new", authMiddleware, async (req, res) => {
  try {
    const { botId } = req.body;
    const userId = req.user.userId;

    // Verify bot exists
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ msg: "Bot not found" });
    }

    const conversation = new ChatHistory({
      userId,
      botId,
      conversation: [],
      summary: "",
    });

    await conversation.save();
    res.json({
      conversationId: conversation._id,
      bot: {
        id: bot._id,
        name: bot.name,
        icon: bot.icon,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ msg: "Failed to create conversation" });
  }
});

router.post("/:conversationId/save-message", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { role, text } = req.body;
    const conversation = await ChatHistory.findById(conversationId);
    if (!conversation) return res.status(404).json({ msg: "Conversation not found" });

    conversation.conversation.push({ role, text });
    await conversation.save();
    res.json({ msg: "Message saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Failed to save message" });
  }
});

router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const conversations = await ChatHistory.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId), // Proper ObjectId creation
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "bots",
          localField: "botId",
          foreignField: "_id",
          as: "botDetails",
        },
      },
      { $unwind: "$botDetails" },
      {
        $addFields: {
          lastMessage: {
            $ifNull: [
              { $arrayElemAt: ["$conversation", -1] },
              { role: null, text: null },
            ],
          },
        },
      },
      {
        $project: {
          bot: {
            botId: "$botDetails._id",
            name: "$botDetails.name",
            icon: "$botDetails.icon",
          },
          conversationId: "$_id",
          lastTextSentByUser: {
            $cond: {
              if: { $eq: ["$lastMessage.role", "user"] },
              then: "$lastMessage.text",
              else: {
                $let: {
                  vars: {
                    filtered: {
                      $filter: {
                        input: "$conversation",
                        cond: { $eq: ["$$this.role", "user"] },
                      },
                    },
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$filtered.text", -1] }, null],
                  },
                },
              },
            },
          },
          timeStamp: "$createdAt",
        },
      },
    ]);

    res.json(conversations);
  } catch (error) {
    console.error("Aggregation error:", error);
    res.status(500).json({ msg: "Server error fetching conversations" });
  }
});

router.get("/conversation/:conversationId", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await ChatHistory.findOne({
      _id: conversationId,
      userId: userId,
    }).populate({
      path: "botId",
      select: "name icon systemPrompt",
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    res.json({
      conversationId: conversation._id,
      bot: {
        id: conversation.botId._id,
        name: conversation.botId.name,
        icon: conversation.botId.icon,
      },
      messages: conversation.conversation.map((msg) => ({
        role: msg.role,
        text: msg.text,
        file: msg.file,
        fileTextContent: msg.fileTextContent,
        timestamp: msg._id.getTimestamp(), // MongoDB ObjectIds contain a timestamp
      })),
      createdAt: conversation.createdAt,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ msg: "Server error fetching conversation" });
  }
});

router.post("/shareChat", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.query;
    const userId = req.user.userId;

    // Fetch the conversation from ChatHistory
    const conversation = await ChatHistory.findOne({
      _id: conversationId,
      userId: userId,
    }).populate({
      path: "botId",
      select: "name icon",
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Prepare the data for the shared conversation
    const sharedConversationData = {
      conversationId: conversation._id,
      userId: userId,
      bot: conversation.botId
        ? {
            id: conversation.botId._id || null,
            name: conversation.botId.name || null,
            icon: conversation.botId.icon || null,
          }
        : {},
      messages: conversation.conversation.map((msg) => ({
        role: msg.role || "bot", // Default to "bot" if missing
        text: msg.text || "", // Default to empty string if text is missing
        file: msg.file
          ? {
              filename: msg.file.filename || null,
              filetype: msg.file.filetype || null,
              fileSize: msg.file.fileSize || null,
              filedownloadUrl: msg.file.filedownloadUrl || null,
            }
          : null,
        fileTextContent: msg.fileTextContent || "", // Default to empty string if not provided
        timestamp: msg._id ? msg._id.getTimestamp() : new Date(), // Use current date if timestamp is missing
      })),
    };

    // Save the shared conversation to the new schema
    const sharedConversation = new SharedConversation(sharedConversationData);
    await sharedConversation.save();

    // Return the ID of the shared conversation
    res.status(200).json({
      sharedConversationId: sharedConversation._id,
    });
  } catch (error) {
    console.error("Error sharing conversation:", error);
    res.status(500).json({ msg: "Server error sharing conversation" });
  }
});

router.get("/getSharedConversation", async (req, res) => {
  try {
    const { sharedConversationId } = req.query; // Get sharedConversationId from query params

    // Check if sharedConversationId is provided
    if (!sharedConversationId) {
      return res.status(400).json({ msg: "sharedConversationId is required " });
    }

    // Fetch the shared conversation
    const sharedConversation = await SharedConversation.findById(sharedConversationId);

    if (!sharedConversation) {
      return res.status(404).json({ msg: "Shared conversation not found" });
    }

    // Return the shared conversation data
    res.status(200).json(sharedConversation);
  } catch (error) {
    console.error("Error fetching shared conversation:", error);
    res.status(500).json({ msg: "Server error fetching shared conversation" });
  }
});

router.post("/deleteChat", async (req, res) => {
  try {
    const { conversationId } = req.body; // Get conversationId from Body params

    // Check if sharedConversationId is provided
    if (!conversationId) {
      return res.status(400).json({ msg: "conversationId is required " });
    }

    // Fetch the  conversation @todo do this properly yosef
    // const converstion = await converstion.findById(sharedConversationId);

    // if (!converstion) {
    //   return res.status(404).json({ msg: "conversation not found" });
    // }

    // Return the shared conversation data
    res.status(200).json({msg: "Conversation deleted successfully"});
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ msg: "Server error deleting conversation" });
  }
});

module.exports = router;
