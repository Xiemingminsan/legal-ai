const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

const SharedConversationSchema = new Schema({
  conversationId: { type: Types.ObjectId, required: true }, // Original conversation ID
  userId: { type: Types.ObjectId, required: true }, // User who shared the conversation
  bot: {
    id: { type: Types.ObjectId, default: null },
    name: { type: String, default: null },
    icon: { type: String, default: null },
  },
  messages: [
    {
      role: { type: String, enum: ["user", "bot"], required: true },
      text: { type: String, required: true },
      fileTextContent: { type: String, default: "" },
      file: {
        filename: { type: String, default: null },
        filetype: { type: String, default: null },
        fileSize: { type: Number, default: null },
        filedownloadUrl: { type: String, default: null },
      },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});
const SharedConversation = mongoose.model("SharedConversation", SharedConversationSchema);

module.exports = SharedConversation;
