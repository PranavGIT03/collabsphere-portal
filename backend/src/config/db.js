const mongoose = require('mongoose');

// Cache connection across serverless invocations
let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
    await seedAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    if (!process.env.VERCEL) {
      console.error('Retrying in 10 seconds...');
      setTimeout(connectDB, 10_000);
    }
  }
};

const seedAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const exists = await User.findOne({ role: 'admin' });
    if (!exists) {
      await User.create({
        name: 'Admin',
        email: 'admin@portal.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        headline: 'Platform Administrator',
      });
      console.log('Default admin created → admin@portal.com / admin123');
    }
  } catch (_) {}
};

module.exports = connectDB;
