const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
const os = require("os");
const si = require("systeminformation");
const ChatHistory = require("../models/ChatHistory");
const User = require("../models/User");
const SystemPrompt = require("../models/SystemPrompt");
const Document = require("../models/Document");
const Bot = require("../models/Bot");
const moment = require("moment");

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

router.get("/getAllUsers", async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find();

    // Check if users are found
    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    // Return the list of users
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ msg: "Server error fetching users" });
  }
});

router.post("/suspendUser", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ msg: "User ID is required" });
    }

    // // Find and delete the user by ID
    // const deletedUser = await User.findByIdAndDelete(userId);

    // if (!deletedUser) {
    //   return res.status(404).json({ msg: "User not found" });
    // }

    res.json({ msg: "Implement Mee Backend /suspendUser" });
  } catch (error) {
    console.error("Error Suspending user:", error.message);
    res.status(500).json({ msg: "Server error Suspending user" });
  }
});

router.get("/getDashboardData", async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.countDocuments();

    // Total documents uploaded count
    const totalDocuments = await Document.countDocuments();

    // Total Bots count
    const totalBots = await Bot.countDocuments();

    // Get the last 60 days
    const last60Days = moment().subtract(60, "days");
    const allDates = [];
    for (let i = 0; i < 60; i++) {
      allDates.push(last60Days.clone().add(i, "days").format("YYYY-MM-DD"));
    }

    // Files uploaded in the last 60 days
    const documentUploads = await Document.aggregate([
      { $match: { uploadDate: { $gte: last60Days.toDate() } } },
      {
        $project: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$uploadDate" } },
        },
      },
      { $group: { _id: "$date", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Initialize uploads data for the last 60 days with zero counts
    const uploadsLast60Days = allDates.map((date) => {
      const found = documentUploads.find((item) => item._id === date);
      return { date, count: found ? found.count : 0 };
    });

    // Recent signups - last 10 users
    const recentSignups = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("username fullname email createdAt");

    // Trending bots - top 5 bots with random usersInteracted count
    const trendingBots = await Bot.find().limit(5);
    const botsWithInteractions = trendingBots.map((bot) => ({
      _id: bot._id,
      name: bot.name,
      usersInteracted: Math.floor(Math.random() * 500), // Random number for usersInteracted
    }));

    // Prepare response data
    const dashboardData = {
      headerData: {
        totalUsers,
        totalDocuments,
        totalBots,
      },
      uploadsLast60Days,
      recentSignups,
      trendingBots: botsWithInteractions,
    };

    res.json(dashboardData);
  } catch (error) {
    console.error("Error fetching dashboard data:", error.message);
    res.status(500).json({ msg: "Server error fetching dashboard data" });
  }
});

router.get("/getAllBots", async (req, res) => {
  try {
    // Fetch all bots from the database
    const bots = await Bot.find();

    // Return the list of bots
    res.json({
      primaryBots: bots,
      userBots: bots,
    });
  } catch (error) {
    console.error("Error fetching bots:", error.message);
    res.status(500).json({ msg: "Server error fetching bots" });
  }
});

module.exports = router;
