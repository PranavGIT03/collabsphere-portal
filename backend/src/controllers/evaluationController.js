const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');
const User = require('../models/User');

const calculateAverage = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const createEvaluation = async (req, res, next) => {
  try {
    const { projectId, studentId, workQuality, efficiency, regularity, contribution, detailedFeedback, futureProspects } =
      req.body;

    if (!projectId || !studentId || !workQuality || !efficiency || !regularity || !contribution || !detailedFeedback) {
      return res.status(400).json({ message: 'All evaluation fields except future prospects are required' });
    }

    const [project, student] = await Promise.all([Project.findById(projectId), User.findById(studentId)]);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (!student || student.role === 'faculty') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const metrics = [workQuality, efficiency, regularity, contribution].map(Number);
    const average = calculateAverage(metrics).toFixed(1);
    const printableSummary = `${student.name} worked on "${project.title}" under ${req.user.name}. Average evaluation: ${average}/5. Feedback: ${detailedFeedback}${futureProspects ? ` Future prospects: ${futureProspects}` : ''}`;

    const evaluation = await Evaluation.create({
      project: project._id,
      student: student._id,
      faculty: req.user._id,
      workQuality: Number(workQuality),
      efficiency: Number(efficiency),
      regularity: Number(regularity),
      contribution: Number(contribution),
      detailedFeedback,
      futureProspects: futureProspects || '',
      printableSummary,
    });

    student.facultyFeedbackSummary = printableSummary;
    student.notifications.unshift({
      type: 'evaluation',
      message: `A new evaluation from ${req.user.name} was added to your permanent profile.`,
      project: project._id,
    });
    student.notifications = student.notifications.slice(0, 25);
    await student.save();

    const savedEvaluation = await Evaluation.findById(evaluation._id)
      .populate('project', 'title basket')
      .populate('student', 'name role headline')
      .populate('faculty', 'name department');

    return res.status(201).json(savedEvaluation);
  } catch (error) {
    return next(error);
  }
};

const listMyEvaluations = async (req, res, next) => {
  try {
    const filter = req.user.role === 'faculty' ? { faculty: req.user._id } : { student: req.user._id };
    const evaluations = await Evaluation.find(filter)
      .sort({ createdAt: -1 })
      .populate('project', 'title basket projectType')
      .populate('student', 'name role headline')
      .populate('faculty', 'name department')
      .lean();

    return res.status(200).json(evaluations);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEvaluation,
  listMyEvaluations,
};
