const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await seedAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Retrying in 10 seconds...');
    setTimeout(connectDB, 10_000);
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
  } catch (_) {
    // non-fatal
  }
};

module.exports = connectDB;
