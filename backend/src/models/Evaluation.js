const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workQuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    efficiency: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    regularity: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    contribution: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    detailedFeedback: {
      type: String,
      required: true,
      trim: true,
    },
    futureProspects: {
      type: String,
      default: '',
      trim: true,
    },
    printableSummary: {
      type: String,
      required: true,
      trim: true,
    },
    storedPermanently: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
