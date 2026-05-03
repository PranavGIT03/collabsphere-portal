const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title:   { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['announcement', 'deadline', 'notice', 'general'],
      default: 'general',
    },
    imagePath: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
