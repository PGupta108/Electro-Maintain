require('dotenv').config();
const dns = require('dns');
// Fix DNS resolution for MongoDB Atlas (use Google DNS as fallback)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const reminderRoutes = require('./routes/reminders');
const mlRoutes = require('./routes/ml');
const { sendDueReminders } = require('./middleware/emailCron');

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// ─── DATABASE ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/electromaintain')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/ml', mlRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── CRON: Daily email reminders at 8:00 AM ───────────────────────────────────
cron.schedule('0 8 * * *', () => {
  console.log('⏰ Running daily reminder email job...');
  sendDueReminders();
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
