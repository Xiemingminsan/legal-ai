// src/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    proAccount: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "user", // could be 'admin'
    },
    ethiopianLawKnowledge: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      required: false,
    },
    legalProcessUnderstanding: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: false,
    },
    legalTerminologyComfort: {
      type: String,
      enum: ["Not Comfortable", "Somewhat Comfortable", "Very Comfortable"],
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
