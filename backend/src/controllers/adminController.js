const User = require('../models/User');
const Project = require('../models/Project');

const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProjects, totalApplications] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Project.aggregate([{ $project: { count: { $size: '$applications' } } }, { $group: { _id: null, total: { $sum: '$count' } } }]),
    ]);

    const [students, faculty] = await Promise.all([
      User.countDocuments({ role: { $in: ['student', 'alumni'] } }),
      User.countDocuments({ role: 'faculty' }),
    ]);

    const openProjects = await Project.countDocuments({ status: 'open' });

    return res.status(200).json({
      totalUsers,
      totalProjects,
      totalApplications: totalApplications[0]?.total || 0,
      students,
      faculty,
      openProjects,
    });
  } catch (error) {
    return next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select('name email role department branch domain position rollNumber year cgpa createdAt')
      .sort({ createdAt: -1 }).lean();

    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};

const listAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.find()
      .sort({ createdAt: -1 })
      .populate('professor', 'name department domain')
      .lean();
    return res.status(200).json(projects);
  } catch (error) {
    return next(error);
  }
};

module.exports = { getStats, listUsers, listAllProjects };
