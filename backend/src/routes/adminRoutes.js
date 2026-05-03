const express = require('express');
const { getStats, listUsers, listAllProjects } = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/projects', listAllProjects);

module.exports = router;
