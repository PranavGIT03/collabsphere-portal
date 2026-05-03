const express = require('express');
const {
  createProject, listProjects, getProjectById,
  applyToProject, addDiscussion, reviewApplication,
  updateProjectStatus, archiveProject,
} = require('../controllers/projectController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const assetUpload = require('../middleware/assetUploadMiddleware');

const router = express.Router();

router.get('/', protect, listProjects);
router.get('/:projectId', protect, getProjectById);
router.post('/', protect, authorizeRoles('faculty'), assetUpload.single('attachment'), createProject);
router.post('/:projectId/apply', protect, authorizeRoles('student', 'alumni'), applyToProject);
router.post('/:projectId/discussions', protect, addDiscussion);
router.post('/:projectId/applications/:applicationId/review', protect, authorizeRoles('faculty'), reviewApplication);
router.patch('/:projectId/status', protect, authorizeRoles('faculty'), updateProjectStatus);
router.post('/:projectId/archive', protect, authorizeRoles('faculty'), archiveProject);

module.exports = router;
