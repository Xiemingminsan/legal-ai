const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
const os = require("os");
const si = require("systeminformation");
const ChatHistory = require("../models/ChatHistory");
const SystemPrompt = require("../models/SystemPrompt");



router.get("/getServerHealth", async (req, res) => {
  try {
    //@todo check admin auth here

    // Get basic system info
    const cpuUsage = await si.currentLoad();
    const memoryInfo = await si.mem();
    const diskInfo = await si.fsSize();

    // Calculate storage details (assuming single drive; adjust if multiple drives)
    const totalStorage = diskInfo[0].size / (1024 * 1024 * 1024); // Convert bytes to GB
    const usedStorage = diskInfo[0].used / (1024 * 1024 * 1024); // Convert bytes to GB
    const freeStorage = totalStorage - usedStorage;
    const storageUsagePercentage = ((usedStorage / totalStorage) * 100).toFixed(2);

    // Prepare server health data
    const serverHealth = {
      cpuUsage: parseFloat(cpuUsage.currentLoad.toFixed(1)), // Round to 1 decimal point
      memoryUsage: parseFloat(((memoryInfo.active / memoryInfo.total) * 100).toFixed(1)), // Round to 1 decimal point
      uptime: parseFloat(os.uptime().toFixed(1)), // Round uptime to 1 decimal point
      platform: os.platform(),
      storage: {
        total: `${totalStorage.toFixed(0)}GB`, // Total storage in GB
        free: `${freeStorage.toFixed(0)}GB`, // Free storage in GB
        usedPercentage: `${storageUsagePercentage}%`, // Used storage percentage
      },
    };

    const systemPrompt = await SystemPrompt.findOne({});

    res.json({ serverHealth: serverHealth, systemPrompt: systemPrompt.prompt });
  } catch (error) {
    console.error("Error fetching server health:", error.message);
    res.status(500).json({ msg: "Server error fetching health metrics" });
  }
});

router.post("/updateSystemPrompt", async (req, res) => {
  try {
    //@todo admin check here

    console.log(req.body);

    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ msg: "Prompt is required" });
    }

    // Update the system prompt in the database
    const updatedPrompt = await SystemPrompt.findOneAndUpdate(
      {},
      { prompt },
      { new: true, upsert: true } // upsert to create if not found
    );

    res.json(updatedPrompt);
  } catch (error) {
    console.error("Error updating system prompt:", error.message);
    res.status(500).json({ msg: "Server error updating system prompt" });
  }
});

module.exports = router;
