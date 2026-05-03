const mongoose = require('mongoose');

mongoose.set('bufferCommands', false); // fail immediately instead of buffering

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    }).then(async () => {
      console.log('MongoDB connected');
      await seedAdmin();
    }).catch((err) => {
      connectionPromise = null; // allow retry on next request
      throw err;
    });
  }

  await connectionPromise;
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
