const express = require('express');
const { getConversations, getUnreadCount, getThread, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/thread/:userId', protect, getThread);
router.post('/thread/:userId', protect, sendMessage);

module.exports = router;
