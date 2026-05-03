const express = require('express');
const { createPost, listPosts, deletePost, deletePostImage } = require('../controllers/postController');
const { addComment } = require('../controllers/commentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, listPosts);
router.post('/', protect, authorizeRoles('faculty', 'admin'), upload.single('image'), createPost);
router.delete('/:postId', protect, authorizeRoles('faculty', 'admin'), deletePost);
router.delete('/:postId/image', protect, authorizeRoles('faculty', 'admin'), deletePostImage);
router.post('/:postId/comments', protect, addComment);

module.exports = router;
