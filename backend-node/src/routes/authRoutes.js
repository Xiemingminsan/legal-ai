const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const User = require("../models/User");
const axios = require("axios");
const router = express.Router();
const nodemailer = require("nodemailer");

// Function to generate a random 6-character password
function generateRandomPassword(length = 6) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
}

async function sendPasswordEmail(toEmail, password) {
  const MY_EMAIL = "surafelzewdu2018@gmail.com";
  const APP_PASSWORD = "lonryhhfqmldrsxc"; // Make sure this is an App Password

  // Configure the mail transporter
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "surafelzewdu2018@gmail.com",
      pass: "lonryhhfqmldrsxc",
    },
    secure: false, // Use TLS
    port: 587,
    tls: {
      rejectUnauthorized: false, // Disable SSL certificate verification
    },
  });

  // Define email options
  const mailOptions = {
    from: MY_EMAIL,
    to: toEmail,
    subject: "Your New Password",
    text: `<p>Your new password is: <strong>${password}</strong></p>`, // Fixed syntax
  };

  try {
    // Send email
    let info = await transport.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    // throw new Error('Failed to send email');
    return;
  }
}
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      ethiopianLawKnowledge,
      legalProcessUnderstanding,
      legalTerminologyComfort,
      fullname,
    } = req.body;

    console.log(req.body);

    // Validate input
    if (!username || !email || !fullname) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res
        .status(400)
        .json({ msg: "Username can only contain letters, numbers, and underscores" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ msg: "Username or email already taken" });
    }

    // Generate a random 6-character password
    const password = generateRandomPassword();

    // Send the password to the user's email first
    try {
      await sendPasswordEmail(email, password);
    } catch (emailError) {
      // console.error("Error sending email:", emailError);
      // return res.status(400).json({ msg: "Failed to send password email. Try again later." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create and save new user
    const newUser = new User({
      username,
      email,
      passwordHash,
      ethiopianLawKnowledge,
      legalProcessUnderstanding,
      legalTerminologyComfort,
      fullname,
    });

    await newUser.save();

    res
      .status(201)
      .json({
        msg: "User registered successfully. Check your email for the temporary password.",
        password: password,
      });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Validate input
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user exists
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      username: user.username,
      role: user.role,
      proAccount: user.proAccount,
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/getMyAccount", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Extract the user ID from the authenticated user

    // Find the user in the database by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Respond with user data (excluding sensitive data like password)
    res.json({
      user,
    });
  } catch (err) {
    console.error("Error during getMyAccount:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/changePassword", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body; // Extract old and new password from the request body

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ msg: "Both old and new password are required" });
    }

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Compare old password with the stored password hash
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ msg: "Current password is incorrect" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.passwordHash = newPasswordHash;
    await user.save();

    res.json({ msg: "Password changed successfully" });
  } catch (err) {
    console.error("Error during password change:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/buyProSubscription", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(req.body);
    const { tx_ref, amount } = req.body;

    console.log(tx_ref);

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Add new payment entry
    user.paymentHistory.push({ amount, tx_ref });

    // Activate Pro Account
    user.proAccount = true;

    // Save changes
    await user.save();

    res.json({ msg: "Pro subscription purchased successfully", user });
  } catch (err) {
    console.error("Error during Pro Account Purchase:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/deleteAccount", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("Deleting account of user:", userId);
    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    console.log("Account Deleted successfully");

    res.json({ msg: "Account Deleted successfully" });
  } catch (err) {
    console.error("Error during deletion of user:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE /api/auth/admin/deleteAllUsers
router.delete("/deleteAllUsers", authMiddleware, async (req, res) => {
  try {
    // Delete all users except the admin making the request
    await User.deleteMany();

    res.json({ msg: "All users deleted successfully (except the admin)" });
  } catch (err) {
    console.error("Error during deletion of all users:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
