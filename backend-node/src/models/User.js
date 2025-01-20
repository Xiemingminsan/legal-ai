// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
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
  role: {
    type: String,
    default: 'user', // could be 'admin'
  },
  ethiopianLawKnowledge: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    required: true,
  },
  legalProcessUnderstanding: {
    type: String,
    enum: ['Low', 'Moderate', 'High'],
    required: true,
  },
  legalTerminologyComfort: {
    type: String,
    enum: ['Not Comfortable', 'Somewhat Comfortable', 'Very Comfortable'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
