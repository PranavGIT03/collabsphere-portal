const Post = require('../models/Post');
const Comment = require('../models/Comment');

const addComment = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
    });

    const savedComment = await Comment.findById(comment._id).populate('author', 'name email role');
    return res.status(201).json(savedComment);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  addComment,
};
