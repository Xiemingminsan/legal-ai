// src/routes/botRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Bot = require('../models/Bot');
const Document = require('../models/Document');

//Add bots
router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, description, type, visibility, systemPrompt } = req.body;
      
      // Validate input
      if (!name || !description || !systemPrompt) {
        return res.status(400).json({ msg: 'Missing required fields' });
      }
  
      // Only admins can create primary bots
      if (type === 'primary' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Only admins can create primary bots' });
      }
  
      const bot = new Bot({
        name,
        description,
        type,
        visibility,
        systemPrompt,
        creator: req.user.userId
      });
  
      await bot.save();
      res.status(201).json(bot);
    } catch (error) {
      console.error('Error creating bot:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });
  
//Get Bots
  router.get('/', authMiddleware, async (req, res) => {
      try {
        // Get primary bots
        const primaryBots = await Bot.find({ type: 'primary' });
        
        // Get public custom bots
        const publicCustomBots = await Bot.find({ 
          type: 'custom',
          visibility: 'public'
        });
        
        // Get user's private bots
        const privateBots = await Bot.find({ 
          creator: req.user.userId,
          type: 'private'
        });
    
        res.json({
          primary: primaryBots,
          custom: publicCustomBots,
          private: privateBots
        });
      } catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).json({ msg: 'Server error' });
      }
    });

    // Add document to bot
    router.post('/:botId/documents', authMiddleware, async (req, res) => {
      try {
        const { botId } = req.params;
        const { documentId } = req.body;
    
        const bot = await Bot.findById(botId);
        if (!bot) {
          return res.status(404).json({ msg: 'Bot not found' });
        }
    
        // Check authorization
        if (bot.creator.toString() !== req.user.userId && req.user.role !== 'admin') {
          return res.status(403).json({ msg: 'Not authorized' });
        }
    
        // Check if document exists and is accessible
        const document = await Document.findById(documentId);
        if (!document) {
          return res.status(404).json({ msg: 'Document not found' });
        }
    
        // Add document if not already added
        if (!bot.documents.includes(documentId)) {
          bot.documents.push(documentId);
          await bot.save();
        }
    
        res.json(bot);
      } catch (error) {
        console.error('Error adding document to bot:', error);
        res.status(500).json({ msg: 'Server error' });
      }
    });

// GET /api/bots/:botId    
router.get('/:botId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;
    
    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: 'Bot not found' });

    if (bot.scope === 'private' && bot.ownerId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(bot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error fetching bot' });
  }
});

// PUT /api/bots/:botId
router.put('/:botId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;
    const { title, description, docIds, systemPrompt, scope } = req.body;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: 'Bot not found' });

    // If the user is not the owner or admin, block
    if (bot.ownerId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to update this bot' });
    }

    // Update fields
    if (title) bot.title = title;
    if (description) bot.description = description;
    if (docIds) bot.docIds = docIds;
    if (systemPrompt !== undefined) bot.systemPrompt = systemPrompt;
    if (scope && (scope === 'public' || scope === 'private')) {
      bot.scope = scope;
    }

    await bot.save();
    res.json({ bot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error updating bot' });
  }
});

// DELETE /api/bots/:botId
router.delete('/:botId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { botId } = req.params;

    const bot = await Bot.findById(botId);
    if (!bot) return res.status(404).json({ msg: 'Bot not found' });

    if (bot.ownerId.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this bot' });
    }

    await bot.remove();
    res.json({ msg: 'Bot deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error deleting bot' });
  }
});

module.exports = router;


