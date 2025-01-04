// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

connectDB();

app.use(cors()); app.use(express.json());

app.use('/api/auth', authRoutes); app.use('/api/documents', docRoutes); app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5000; app.listen(PORT, () => { console.log(`Server running on PORT ${PORT}`); });