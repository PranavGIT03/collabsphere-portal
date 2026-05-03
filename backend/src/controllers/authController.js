const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  headline: user.headline || '',
  department: user.department || '',
  domain: user.domain || '',
  position: user.position || '',
  rollNumber: user.rollNumber || '',
  branch: user.branch || '',
  year: user.year || null,
  cgpa: user.cgpa || null,
  skills: user.skills || [],
  interests: user.interests || [],
  profilePalette: user.profilePalette || 'rose',
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, branch, domain, position } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }

    const allowedRoles = ['faculty', 'student', 'alumni'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be student, faculty, or alumni' });
    }

    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role,
      rollNumber: rollNumber || '',
      branch: branch || '',
      domain: domain || '',
      position: position || '',
      headline: role === 'faculty' ? 'Open to mentoring and collaboration' : 'Looking for meaningful projects',
    });

    return res.status(201).json({ user: sanitizeUser(user), token: generateToken(user._id) });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.status(200).json({ user: sanitizeUser(user), token: generateToken(user._id) });
  } catch (error) {
    return next(error);
  }
};

const me = (req, res) => res.status(200).json({ user: sanitizeUser(req.user) });

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond generically to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset code was sent' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordResetToken = crypto.createHash('sha256').update(code).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    console.log(`\n[DEV] Password reset code for ${user.email} → ${code}\n`);

    return res.status(200).json({ message: 'Reset code printed to server console (dev mode)' });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Code and new password are required' });
    }

    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.status(200).json({ message: 'Password updated — please log in' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { register, login, me, forgotPassword, resetPassword };
