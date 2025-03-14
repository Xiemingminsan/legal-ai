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
const { processUploadedFile } = require("../helpers/extractor");
const { Types, Schema } = mongoose;
const User = require('../models/User');
const SystemPrompt=require('../models/SystemPrompt');   

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
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'text/docx',
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported types: DOCX, PDF, TXT, JPG, JPEG, PNG`), false);
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });


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

    let fileData = null;
    let processedFile = null;
    let counter = false;

    // Process uploaded file
    if (req.file) {
      try {
        counter=true;
        processedFile = await processUploadedFile(req.file);
        
        fileData = {
          filename: req.file.filename,
          filetype: req.file.mimetype,
          fileSize: (req.file.size / 1048576).toFixed(2),
          filedownloadUrl: `uploads/userChatUpload/${req.file.filename}`,
          processedContent: processedFile.content
        };

        console.log("File processed successfully:", processedFile);
      } catch (error) {
        console.error("File processing error:", error);
        return res.status(400).json({ msg: "Error processing uploaded file" });
      }
    } else {
      counter=false
    }

    // Initialize or find conversation
    let conversation = conversationId 
      ? await ChatHistory.findOne({ _id: conversationId, userId })
      : new ChatHistory({ userId, conversation: [], chunksUsed: [], summary: "" });

    if (conversationId && !conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Find bot
    const bot = await Bot.findById(conversation.botId).populate("documents");
    if (!bot) {
      return res.status(404).json({ msg: "Bot not found" });
    }



    // Add message to conversation
    conversation.conversation.push({
      role: "user",
      text: query,
      fileTextContent: processedFile?.type === 'pdf' ? processedFile.content : null,
      file: fileData
    });


    // Build context with file content
    const context = [
      conversation.summary,
      ...(conversation.conversation?.slice(-20) || []).map(msg => {
        let msgText = `${msg.role}: ${msg.text}`;
        if (msg.file && counter == true) {
          console.log("File content found in context:", msg.file);
          msgText += `\n This is the File or Image content the user sent inline from the chat and is additonal context, If found no answer from the normal context, refer to this and check as well: ${msg.file}`;
        }
        return msgText;
      }),
      ...(conversation.chunksUsed?.slice(-5) || []).map(chunk => 
        `Chunk from doc ${chunk.doc_id}:\n${chunk.text}`
      )
    ].filter(Boolean).join("\n");

    systemPrompt=await SystemPrompt.findOne();
    
    const user = await User.findById(userId);

    let formattedKnowledge = '';

    if (user) {
      formattedKnowledge = `Logged in User's Legal Knowledge, use this into context when answering:
      - Ethiopian Law Knowledge: ${user.ethiopianLawKnowledge || "Unknown"} From (Beginner / Intermediate / Expert)
      - Legal Process Understanding: ${user.legalProcessUnderstanding || "Unknown"} From (Low / Moderate / High)
      - Legal Terminology Comfort: ${user.legalTerminologyComfort || "Unknown"} From (Not Comfortable / Somewhat Comfortable / Very Comfortable)`;
      
      console.log(formattedKnowledge);
    }
    
    // Concatenate system prompt and formatted knowledge into one variable
    let system_prompt = `${systemPrompt.prompt}\n\n${formattedKnowledge}`;    
    // Concatenate system prompt and formatted knowledge

    
    // add meeeee


    // Call AI service with enhanced payload
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    const payload = new URLSearchParams({
      language: language || "en",
      query,
      context,
      system_prompt,
      bot_id: bot._id.toString(),
      top_k: "1000"
    });

    // Add image data if present
    if (processedFile?.type === 'image') {
      payload.append('image_data', processedFile.content);
      payload.append('image_type', processedFile.mimeType);
    }

    const aiResponse = await axios.post(
      `${aiServiceUrl}/qa`,
      payload,
      { 
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Max-Content-Length": "50mb"
        } 
      }
    );

    if (!aiResponse.data || !aiResponse.data.answer) {
      throw new Error("Invalid response from AI service");
    }

    // Update conversation with AI response
    conversation.conversation.push({
      role: "bot",
      text: aiResponse.data.answer
    });

    if (aiResponse.data.chunksUsed?.length > 0) {
      conversation.chunksUsed = [
        ...conversation.chunksUsed, 
        ...aiResponse.data.chunksUsed
      ].slice(-50);
    }

    await conversation.save();

    return res.json({
      conversationId: conversation._id,
      conversation: conversation.conversation
    });

  } catch (error) {
    console.error("Error in /ask-ai:", error.message);
    return res.status(500).json({
      msg: "Server error in AI communication",
      error: error
    });
  }
});

// router.post("/ask-ai", authMiddleware, upload.single("file"), async (req, res) => {
//   try {
//     const { query, conversationId, language } = req.body;
//     const userId = req.user.userId;

//     if (!query) {
//       return res.status(400).json({ msg: "Query cannot be empty" });
//     }

//     let fileData = null;
//     let processedFile = null;
//     let counter = false;

//     if (req.file) {
//       try {
//         counter = true;
//         processedFile = await processUploadedFile(req.file);

//         fileData = {
//           filename: req.file.filename,
//           filetype: req.file.mimetype,
//           fileSize: (req.file.size / 1048576).toFixed(2),
//           filedownloadUrl: `uploads/userChatUpload/${req.file.filename}`,
//           processedContent: processedFile.content
//         };

//         console.log("File processed successfully:", processedFile);
//       } catch (error) {
//         console.error("File processing error:", error);
//         return res.status(400).json({ msg: "Error processing uploaded file" });
//       }
//     } else {
//       counter = false;
//     }

//     let conversation = conversationId
//       ? await ChatHistory.findOne({ _id: conversationId, userId })
//       : new ChatHistory({ userId, conversation: [], chunksUsed: [], summary: "" });

//     if (conversationId && !conversation) {
//       return res.status(404).json({ msg: "Conversation not found" });
//     }

//     const bot = await Bot.findById(conversation.botId).populate("documents");
//     if (!bot) {
//       return res.status(404).json({ msg: "Bot not found" });
//     }

//     conversation.conversation.push({
//       role: "user",
//       text: query,
//       fileTextContent: processedFile?.type === 'pdf' ? processedFile.content : null,
//       file: fileData
//     });

//     // FAKE AI RESPONSE
//     const fakeAiResponse = `### 🤖 AI Response  
// ✅ **Key Information:** This is a sample response.  
// 📌 **Your Query:** "${query}"  
// 📚 **Possible Explanation:**  
// - AI is currently unavailable, so this is a placeholder response.  
// - The real AI would analyze legal documents and provide structured feedback.  
// - Please try again later for a more detailed answer.`;

//     conversation.conversation.push({
//       role: "bot",
//       text: fakeAiResponse
//     });

//     await conversation.save();

//     return res.json({
//       conversationId: conversation._id,
//       conversation: conversation.conversation
//     });

//   } catch (error) {
//     console.error("Error in /ask-ai:", error.message);
//     return res.status(500).json({
//       msg: "Server error in AI communication",
//       error: error
//     });
//   }
// });

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

// Add this to your existing router file

router.post("/deleteChat", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.userId;

    // Validate conversation ID
    if (!conversationId) {
      return res.status(400).json({ msg: "Conversation ID is required" });
    }

    // Find the conversation and ensure it belongs to the user
    const conversation = await ChatHistory.findOne({
      _id: conversationId,
      userId: userId
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    // Check if conversation is empty (no messages)
      // Delete the conversation
      await ChatHistory.findByIdAndDelete(conversationId);
      return res.status(200).json({ 
        msg: "Empty conversation deleted successfully",
        deleted: true
      });
    } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({ 
      msg: "Server error deleting conversation",
      error: error.message 
    });
  }
});

module.exports = router;
