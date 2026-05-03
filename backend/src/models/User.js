const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role:     { type: String, enum: ['faculty', 'student', 'alumni', 'admin'], required: true },

    // ── Student-specific ──────────────────────────────────
    rollNumber: { type: String, default: '', trim: true },
    branch:     { type: String, default: '', trim: true },
    year:       { type: Number, default: null, min: 1, max: 4 },
    cgpa:       { type: Number, default: null, min: 0, max: 10 },

    // ── Faculty-specific ──────────────────────────────────
    domain:     { type: String, default: '', trim: true },
    position:   { type: String, default: '', trim: true },
    contactInfo:{ type: String, default: '', trim: true },

    // ── Shared profile ────────────────────────────────────
    headline:   { type: String, default: '', trim: true },
    bio:        { type: String, default: '', trim: true },
    department: { type: String, default: '', trim: true },
    graduationYear: { type: Number, default: null },
    skills:     [{ type: String, trim: true }],
    interests:  [{ type: String, trim: true }],
    resumePath: { type: String, default: null },
    linkedinUrl:{ type: String, default: '', trim: true },
    githubUrl:  { type: String, default: '', trim: true },
    privateProjects: [
      {
        title:       { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        stack:       [{ type: String, trim: true }],
      },
    ],
    courseBackground: [
      {
        course: { type: String, trim: true, default: '' },
        grade:  { type: String, trim: true, default: '' },
      },
    ],
    achievements:          [{ type: String, trim: true }],
    facultyFeedbackSummary:{ type: String, default: '', trim: true },
    followedProfessors:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifications: [
      {
        type: {
          type: String,
          enum: ['project', 'evaluation', 'followed-professor'],
          default: 'project',
        },
        message:   { type: String, required: true, trim: true },
        project:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
        read:      { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    profilePalette: { type: String, default: 'rose', trim: true },
    backgroundVerification: {
      resumeVerified:  { type: Boolean, default: false },
      linkedinVerified:{ type: Boolean, default: false },
      githubVerified:  { type: Boolean, default: false },
      notes:      { type: String, default: '', trim: true },
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      lastCheckedAt: { type: Date, default: null },
    },

    // ── Password reset ────────────────────────────────────
    passwordResetToken:   { type: String, default: null },
    passwordResetExpires: { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
