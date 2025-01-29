const mongoose = require("mongoose");

// Define PaymentHistory Schema
const PaymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true, // Payment amount
    },
    start_date: {
      type: Date,
      default: Date.now, // Start date
    },
    end_date: {
      type: Date,
      default: function() {
        return new Date(this.start_date.getTime() + 30*24*60*60*1000); // End date is 30 days from start date
      },
    },
    tx_ref: {
      type: String,
    },
  },
);

// Define User Schema
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
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
    paymentHistory: {
      type: [PaymentHistorySchema], // Embed payment history
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
