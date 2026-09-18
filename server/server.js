require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middlewares/errorHandler');

// Route Imports
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const roundRoutes = require('./routes/roundRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' })); // รองรับภาพ Base64
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    spreadsheetId: process.env.SPREADSHEET_ID || "1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo",
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR",
  });
});

// API Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/round', roundRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `ไม่พบ Endpoint: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Food Order Express API Server running on port ${PORT}`);
  console.log(`📊 Google Sheets ID: ${process.env.SPREADSHEET_ID || "1J8l2VuxcboTZ3NSInfiKEvuBBbtzijvSHUkivbKb8yo"}`);
  console.log(`📁 Google Drive Folder: ${process.env.GOOGLE_DRIVE_FOLDER_ID || "1YjjeCt3Vm2GzSIqpnxsHhhqhZeExj9oR"}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
