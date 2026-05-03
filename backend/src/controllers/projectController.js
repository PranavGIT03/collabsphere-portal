const Project = require('../models/Project');
const ProjectDiscussion = require('../models/ProjectDiscussion');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const { inferProjectMetadata, scoreProjectForStudent } = require('../utils/projectClassifier');

const buildFileUrl = (req, filePath) =>
  filePath ? `${req.protocol}://${req.get('host')}${filePath}` : null;

const serializeProject = (req, project, currentUser) => ({
  ...project,
  attachmentUrl: buildFileUrl(req, project.attachmentPath),
  recommendationScore: currentUser ? scoreProjectForStudent(project, currentUser) : 0,
});

const splitList = (value) =>
  String(value || '').split(',').map((s) => s.trim()).filter(Boolean);

const createProject = async (req, res, next) => {
  try {
    const {
      title, summary, description, requiredSkills, tags, yearAudience,
      futureProspectsText, futureProspectsMandatory,
      domain, department, minCgpa, eligibleYears, eligibleDepartments,
      duration, deadline, imageUrl,
    } = req.body;

    if (!title || !summary || !description) {
      return res.status(400).json({ message: 'Title, summary and description are required' });
    }

    const classification = inferProjectMetadata({
      title, summary, description,
      requiredSkills: splitList(requiredSkills),
      tags: splitList(tags),
    });

    const project = await Project.create({
      title, summary, description,
      professor: req.user._id,
      basket: classification.basket,
      projectType: classification.projectType,
      flavorText: classification.flavorText,
      requiredSkills: splitList(requiredSkills),
      tags: splitList(tags),
      yearAudience: splitList(yearAudience),
      domain: domain || '',
      department: department || '',
      minCgpa: minCgpa ? Number(minCgpa) : 0,
      eligibleYears: splitList(eligibleYears),
      eligibleDepartments: splitList(eligibleDepartments),
      duration: duration || '',
      deadline: deadline ? new Date(deadline) : null,
      imageUrl: imageUrl || '',
      attachmentPath: req.file ? `/uploads/${req.file.filename}` : null,
      futureProspects: {
        text: futureProspectsText || '',
        isMandatory: futureProspectsMandatory === 'true' || futureProspectsMandatory === true,
      },
      status: 'open',
    });

    const followers = await User.find({ followedProfessors: req.user._id });
    await Promise.all(
      followers.map((f) => {
        f.notifications.unshift({
          type: 'project',
          message: `${req.user.name} posted a new project: ${title}`,
          project: project._id,
        });
        f.notifications = f.notifications.slice(0, 25);
        return f.save();
      })
    );

    const saved = await Project.findById(project._id)
      .populate('professor', 'name role headline department domain position')
      .populate('contributors', 'name role headline skills')
      .populate('applications.student', 'name role headline skills rollNumber branch year cgpa');

    return res.status(201).json(serializeProject(req, saved.toObject(), req.user));
  } catch (error) {
    return next(error);
  }
};

const listProjects = async (req, res, next) => {
  try {
    const { status, domain, department, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (domain) filter.domain = domain;
    if (department) filter.department = department;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { summary: { $regex: search, $options: 'i' } },
    ];

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate('professor', 'name role headline department domain position')
      .populate('contributors', 'name role headline skills')
      .populate('applications.student', 'name role headline skills rollNumber branch year cgpa')
      .lean();

    const projectIds = projects.map((p) => p._id);
    const discussions = await ProjectDiscussion.find({ project: { $in: projectIds } })
      .sort({ createdAt: 1 })
      .populate('author', 'name role headline')
      .lean();

    const discussionMap = discussions.reduce((acc, d) => {
      const key = d.project.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {});

    return res.status(200).json(
      projects.map((p) =>
        serializeProject(req, { ...p, discussions: discussionMap[p._id.toString()] || [] }, req.user)
      )
    );
  } catch (error) {
    return next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('professor', 'name role headline department domain position')
      .populate('contributors', 'name role headline skills')
      .populate('applications.student', 'name role headline skills rollNumber branch year cgpa');

    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [discussions, evaluations] = await Promise.all([
      ProjectDiscussion.find({ project: project._id }).sort({ createdAt: 1 }).populate('author', 'name role headline').lean(),
      Evaluation.find({ project: project._id }).sort({ createdAt: -1 }).populate('student', 'name role headline').populate('faculty', 'name role department').lean(),
    ]);

    return res.status(200).json({
      project: serializeProject(req, project.toObject(), req.user),
      discussions,
      evaluations,
    });
  } catch (error) {
    return next(error);
  }
};

const applyToProject = async (req, res, next) => {
  try {
    const { pitch } = req.body;
    if (!pitch) return res.status(400).json({ message: 'Statement of interest is required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'open') return res.status(400).json({ message: 'This project is not accepting applications' });

    const alreadyApplied = project.applications.some(
      (a) => a.student.toString() === req.user._id.toString()
    );
    if (alreadyApplied) return res.status(400).json({ message: 'You have already applied to this project' });

    const User = require('../models/User');
    const studentDoc = await User.findById(req.user._id).select('resumeUrl linkedinUrl githubUrl cgpa');

    project.applications.push({
      student:     req.user._id,
      pitch,
      resumeUrl:   studentDoc?.resumeUrl   || '',
      linkedinUrl: studentDoc?.linkedinUrl || '',
      githubUrl:   studentDoc?.githubUrl   || '',
      cgpa:        studentDoc?.cgpa        || null,
      status: 'submitted',
    });
    await project.save();

    return res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    return next(error);
  }
};

const addDiscussion = async (req, res, next) => {
  try {
    const { message, kind } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const discussion = await ProjectDiscussion.create({
      project: project._id,
      author: req.user._id,
      kind: kind === 'comment' ? 'comment' : 'question',
      message,
    });

    const saved = await ProjectDiscussion.findById(discussion._id).populate('author', 'name role headline');
    return res.status(201).json(saved);
  } catch (error) {
    return next(error);
  }
};

const reviewApplication = async (req, res, next) => {
  try {
    const { decision, remarks } = req.body;

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.professor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can review applications' });
    }

    const application = project.applications.id(req.params.applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.status === 'accepted' || application.status === 'declined') {
      return res.status(400).json({ message: 'This application has already been finalised and cannot be changed.' });
    }

    const statusMap = { accept: 'accepted', shortlist: 'shortlisted', decline: 'declined' };
    application.status = statusMap[decision] || 'declined';
    if (remarks) application.remarks = remarks;

    if (decision === 'accept' && !project.contributors.some((c) => c.toString() === application.student.toString())) {
      project.contributors.push(application.student);
    }

    await project.save();

    return res.status(200).json({ message: `Application ${application.status}` });
  } catch (error) {
    return next(error);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'active', 'closed', 'archived'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.professor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can update status' });
    }

    project.status = status;
    if (status === 'archived') project.archivedAt = new Date();
    await project.save();

    return res.status(200).json({ message: `Project status updated to ${status}` });
  } catch (error) {
    return next(error);
  }
};

const archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.professor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project owner can archive this project' });
    }

    project.status = 'archived';
    project.archivedAt = new Date();
    await project.save();

    return res.status(200).json({ message: 'Project archived successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProject, listProjects, getProjectById,
  applyToProject, addDiscussion, reviewApplication,
  updateProjectStatus, archiveProject,
};
