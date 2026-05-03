const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const { scoreProjectForStudent } = require('../utils/projectClassifier');
const Project = require('../models/Project');

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}${filePath}` : null;

const sanitizeUser = (req, user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  headline: user.headline,
  bio: user.bio,
  department: user.department,
  graduationYear: user.graduationYear,
  rollNumber: user.rollNumber || '',
  branch: user.branch || '',
  year: user.year || null,
  cgpa: user.cgpa || null,
  domain: user.domain || '',
  position: user.position || '',
  contactInfo: user.contactInfo || '',
  skills: user.skills || [],
  interests: user.interests || [],
  linkedinUrl: user.linkedinUrl || '',
  githubUrl: user.githubUrl || '',
  resumeUrl: buildFileUrl(req, user.resumePath),
  privateProjects: user.privateProjects || [],
  courseBackground: user.courseBackground || [],
  achievements: user.achievements || [],
  facultyFeedbackSummary: user.facultyFeedbackSummary || '',
  followedProfessors: user.followedProfessors || [],
  notifications: (user.notifications || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
  profilePalette: user.profilePalette || 'rose',
  backgroundVerification: user.backgroundVerification || {},
});

const normalizeArray = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '').split(',').map((s) => s.trim()).filter(Boolean);

const parseListJson = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try { const p = JSON.parse(value); return Array.isArray(p) ? p : fallback; }
  catch (_) { return fallback; }
};

const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('followedProfessors', 'name role headline department');
    const evaluations = await Evaluation.find({ student: req.user._id })
      .populate('project', 'title basket projectType futureProspects')
      .populate('faculty', 'name department')
      .sort({ createdAt: -1 }).lean();
    const projects = await Project.find({ status: { $ne: 'archived' } }).lean();

    const recommendations = projects
      .map((p) => ({ ...p, recommendationScore: scoreProjectForStudent(p, user) }))
      .filter((p) => p.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 5);

    return res.status(200).json({ profile: sanitizeUser(req, user), evaluations, recommendations });
  } catch (error) {
    return next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fields = [
      'headline', 'bio', 'department', 'linkedinUrl', 'githubUrl',
      'facultyFeedbackSummary', 'profilePalette',
      'rollNumber', 'branch', 'domain', 'position', 'contactInfo',
    ];
    fields.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });

    if (req.body.graduationYear) user.graduationYear = Number(req.body.graduationYear);
    if (req.body.year !== undefined) user.year = req.body.year ? Number(req.body.year) : null;
    if (req.body.cgpa !== undefined) user.cgpa = req.body.cgpa ? Number(req.body.cgpa) : null;

    user.skills = normalizeArray(req.body.skills ?? user.skills);
    user.interests = normalizeArray(req.body.interests ?? user.interests);
    user.achievements = normalizeArray(req.body.achievements ?? user.achievements);
    user.privateProjects = parseListJson(req.body.privateProjects, user.privateProjects);
    user.courseBackground = parseListJson(req.body.courseBackground, user.courseBackground);

    await user.save();
    await user.populate('followedProfessors', 'name role headline department');

    return res.status(200).json({ profile: sanitizeUser(req, user), message: 'Profile updated' });
  } catch (error) {
    return next(error);
  }
};

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Resume file is required' });
    const user = await User.findById(req.user._id);
    user.resumePath = `/uploads/${req.file.filename}`;
    user.backgroundVerification.resumeVerified = false;
    await user.save();
    return res.status(200).json({ resumeUrl: buildFileUrl(req, user.resumePath), message: 'Resume uploaded' });
  } catch (error) {
    return next(error);
  }
};

const listFacultyProfiles = async (req, res, next) => {
  try {
    const faculty = await User.find({ role: { $in: ['faculty', 'alumni'] } })
      .select('name role headline department domain position skills interests')
      .sort({ name: 1 }).lean();
    return res.status(200).json(faculty);
  } catch (error) {
    return next(error);
  }
};

const toggleFollowProfessor = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.facultyId);
    if (!target || target.role !== 'faculty') return res.status(404).json({ message: 'Faculty not found' });

    const user = await User.findById(req.user._id);
    const following = user.followedProfessors.some((id) => id.toString() === req.params.facultyId);
    user.followedProfessors = following
      ? user.followedProfessors.filter((id) => id.toString() !== req.params.facultyId)
      : [...user.followedProfessors, target._id];

    await user.save();
    await user.populate('followedProfessors', 'name role headline department');
    return res.status(200).json({ following: !following, followedProfessors: user.followedProfessors });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile, uploadResume, listFacultyProfiles, toggleFollowProfessor };
