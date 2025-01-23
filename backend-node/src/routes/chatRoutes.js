const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
const ChatHistory = require("../models/ChatHistory");
const Bot = require("../models/Bot");
const mongoose = require('mongoose');
const { Types } = mongoose;

router.post("/ask-ai", authMiddleware, async (req, res) => {
  try {
    const { query, conversationId, language } = req.body;
    const userId = req.user.userId;
    
    if (!query) {
      return res.status(400).json({ msg: "Query cannot be empty" });
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
        summary: ""
      });
    }
    
    // Find bot and verify it exists
    const bot = await Bot.findById(conversation.botId).populate("documents");
    if (!bot) {
      return res.status(404).json({ msg: "Bot not found" });
    }
    
    const botContext = bot.systemPrompt ? bot.systemPrompt + "\n\n" : "";
    
    // Add user query to the conversation
    conversation.conversation.push({ role: "user", text: query });
    
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
      ...conversation.conversation
        .slice(-20)
        .map((msg) => `${msg.role}: ${msg.text}`),
      ...conversation.chunksUsed
        .slice(-5)
        .map((chunk) => `Chunk from doc ${chunk.doc_id}:\n${chunk.text}`)
    ].filter(Boolean).join("\n");
    
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
          top_k: "10"
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      
      if (!aiResponse.data || !aiResponse.data.answer) {
        throw new Error("Invalid response from AI service");
      }
      
      const aiAnswer = aiResponse.data.answer;
      const usedChunks = aiResponse.data.chunksUsed || [];
      
      conversation.conversation.push({ role: "bot", text: aiAnswer });
      
      // Update chunks used
      if (usedChunks.length > 0) {
        conversation.chunksUsed = [
          ...conversation.chunksUsed,
          ...usedChunks
        ].slice(-50); // Keep only last 50 chunks
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
        error: error.message 
      });
    }
    
  } catch (error) {
    console.error("Error in /ask-ai:", error.message);
    return res.status(500).json({ 
      msg: "Server error in AI communication",
      error: error.message 
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
      summary: ""
    });

    await conversation.save();
    res.json({ 
      conversationId: conversation._id,
      bot: {
        id: bot._id,
        name: bot.name,
        icon: bot.icon
      }
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
          userId: new Types.ObjectId(userId) // Proper ObjectId creation
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "bots",
          localField: "botId",
          foreignField: "_id",
          as: "botDetails"
        }
      },
      { $unwind: "$botDetails" },
      {
        $addFields: {
          lastMessage: {
            $ifNull: [
              { $arrayElemAt: ["$conversation", -1] },
              { role: null, text: null }
            ]
          }
        }
      },
      {
        $project: {
          bot: {
            botId: "$botDetails._id",
            name: "$botDetails.name",
            icon: "$botDetails.icon"
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
                        cond: { $eq: ["$$this.role", "user"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [
                      { $arrayElemAt: ["$$filtered.text", -1] },
                      null
                    ]
                  }
                }
              }
            }
          },
          timeStamp: "$createdAt"
        }
      }
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
      userId: userId 
    }).populate({
      path: 'botId',
      select: 'name icon systemPrompt'
    });

    if (!conversation) {
      return res.status(404).json({ msg: "Conversation not found" });
    }

    res.json({
      conversationId: conversation._id,
      bot: {
        id: conversation.botId._id,
        name: conversation.botId.name,
        icon: conversation.botId.icon
      },
      messages: conversation.conversation.map(msg => ({
        role: msg.role,
        text: msg.text,
        timestamp: msg._id.getTimestamp() // MongoDB ObjectIds contain a timestamp
      })),
      createdAt: conversation.createdAt
    });

  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ msg: "Server error fetching conversation" });
  }
});

module.exports = router;