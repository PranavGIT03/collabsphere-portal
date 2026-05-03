const express = require('express');
const { createEvaluation, listMyEvaluations } = require('../controllers/evaluationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, listMyEvaluations);
router.post('/', protect, authorizeRoles('faculty'), createEvaluation);

module.exports = router;
