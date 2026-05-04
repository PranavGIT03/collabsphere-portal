const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const profileRoutes = require('./routes/profileRoutes');
const projectRoutes = require('./routes/projectRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

const app = express();

// Allow all origins in production
app.use(cors({ credentials: true }));

app.use(express.json());

// Uploads — only available when running locally (Vercel has no persistent filesystem)
if (!process.env.VERCEL) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir));
}

// Serve static frontend assets without waiting for MongoDB. Otherwise a missing
// or slow DB connection can make Vercel return non-JS responses for the bundle.
const frontendDist = path.join(__dirname, '..', 'public');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// ── API ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Ensure DB is connected before every API request (critical for serverless cold starts)
app.use('/api', async (_req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: 'Database unavailable, please retry' });
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// ── Serve built frontend ──────────────────────────────────
if (fs.existsSync(frontendDist)) {
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

// Listen only outside Vercel serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
