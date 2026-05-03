const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    summary:     { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    professor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contributors:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // ── Classification (auto-inferred) ───────────────────
    basket:      { type: String, required: true, trim: true },
    projectType: { type: String, required: true, trim: true },
    flavorText:  { type: String, required: true, trim: true },

    // ── Faculty-supplied metadata ─────────────────────────
    domain:      { type: String, default: '', trim: true },
    department:  { type: String, default: '', trim: true },
    duration:    { type: String, default: '', trim: true },
    deadline:    { type: Date,   default: null },
    imageUrl:    { type: String, default: '', trim: true },
    minCgpa:     { type: Number, default: 0, min: 0, max: 10 },
    eligibleYears:       [{ type: String, trim: true }],
    eligibleDepartments: [{ type: String, trim: true }],
    requiredSkills:      [{ type: String, trim: true }],
    tags:                [{ type: String, trim: true }],
    yearAudience:        [{ type: String, trim: true }],

    status: {
      type: String,
      enum: ['open', 'active', 'closed', 'archived'],
      default: 'open',
    },
    attachmentPath: { type: String, default: null },
    futureProspects: {
      text:        { type: String, default: '', trim: true },
      isMandatory: { type: Boolean, default: false },
    },

    applications: [
      {
        student:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        pitch:       { type: String, required: true, trim: true },
        resumeUrl:   { type: String, default: '', trim: true },
        linkedinUrl: { type: String, default: '', trim: true },
        githubUrl:   { type: String, default: '', trim: true },
        cgpa:        { type: Number, default: null },
        status:  {
          type: String,
          enum: ['submitted', 'shortlisted', 'accepted', 'declined'],
          default: 'submitted',
        },
        remarks:   { type: String, default: '', trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
