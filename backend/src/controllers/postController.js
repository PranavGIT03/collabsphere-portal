const Post = require('../models/Post');
const Comment = require('../models/Comment');
const fs = require('fs');
const path = require('path');

const getImageUrl = (req, imagePath) =>
  imagePath ? `${req.protocol}://${req.get('host')}${imagePath}` : null;

const deleteImageFromDisk = async (imagePath) => {
  if (!imagePath) return;
  const abs = path.join(__dirname, '..', '..', imagePath.replace(/^\/+/, ''));
  try { await fs.promises.unlink(abs); } catch (e) { if (e.code !== 'ENOENT') throw e; }
};

const canModify = (post, userId) => post.author.toString() === userId.toString();

const createPost = async (req, res, next) => {
  try {
    const { title, content, type } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

    const post = await Post.create({
      title, content,
      type: type || 'general',
      author: req.user._id,
      imagePath: req.file ? `/uploads/${req.file.filename}` : null,
    });

    const saved = await Post.findById(post._id).populate('author', 'name email role');
    return res.status(201).json({ ...saved.toObject(), imageUrl: getImageUrl(req, saved.imagePath) });
  } catch (error) {
    return next(error);
  }
};

const listPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'name email role').lean();

    const postIds = posts.map((p) => p._id);
    const comments = await Comment.find({ post: { $in: postIds } })
      .sort({ createdAt: 1 }).populate('author', 'name email role').lean();

    const commentMap = comments.reduce((acc, c) => {
      const key = c.post.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(c);
      return acc;
    }, {});

    return res.status(200).json(
      posts.map((p) => ({ ...p, comments: commentMap[p._id.toString()] || [], imageUrl: getImageUrl(req, p.imagePath) }))
    );
  } catch (error) {
    return next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canModify(post, req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete this post' });
    }
    await Comment.deleteMany({ post: post._id });
    await deleteImageFromDisk(post.imagePath);
    await post.deleteOne();
    return res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    return next(error);
  }
};

const deletePostImage = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId).populate('author', 'name email role');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!canModify(post, req.user._id)) return res.status(403).json({ message: 'Cannot modify this post' });
    if (!post.imagePath) return res.status(400).json({ message: 'No image to delete' });
    const old = post.imagePath;
    post.imagePath = null;
    await post.save();
    await deleteImageFromDisk(old);
    return res.status(200).json({ ...post.toObject(), imageUrl: null });
  } catch (error) {
    return next(error);
  }
};

module.exports = { createPost, listPosts, deletePost, deletePostImage };
