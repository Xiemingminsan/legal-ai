require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const chatRoutes = require('./routes/chatRoutes');
const docAnalysisRoutes = require('./routes/docAnalysisRoutes');
const stemmerRoutes = require('./routes/stemmerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const botRoutes = require('./routes/botRoutes');



const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
app.use('/uploads', (req, res, next) => {
    console.log(`File requested: ${req.url}`); // Optional: Logs requests to /uploads
    next();
}, express.static(path.join(__dirname, '../uploads')));

app.use(express.urlencoded({ extended: true }));


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/docAnalysis', docAnalysisRoutes);
app.use('/api/stemmer', stemmerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bots', botRoutes);


// Catch-all route for unhandled paths
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});
