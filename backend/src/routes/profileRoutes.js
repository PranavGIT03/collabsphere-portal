const express = require('express');
const {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  listFacultyProfiles,
  listStudentProfiles,
  toggleFollowProfessor,
} = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const assetUpload = require('../middleware/assetUploadMiddleware');

const router = express.Router();

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.post('/me/resume', protect, assetUpload.single('resume'), uploadResume);
router.get('/faculty', protect, listFacultyProfiles);
router.post('/faculty/:facultyId/follow', protect, toggleFollowProfessor);

module.exports = router;
