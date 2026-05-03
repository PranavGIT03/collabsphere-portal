const Message = require('../models/Message');
const User = require('../models/User');
const censor = require('../utils/censor');

const getConversations = async (req, res, next) => {
  try {
    const me = req.user._id;
    const messages = await Message.find({ $or: [{ sender: me }, { recipient: me }] })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    const convMap = new Map();
    for (const msg of messages) {
      const sId = msg.sender._id.toString();
      const rId = msg.recipient._id.toString();
      const meStr = me.toString();
      const other = sId === meStr ? msg.recipient : msg.sender;
      const key = other._id.toString();
      if (!convMap.has(key)) {
        convMap.set(key, { user: other, lastMessage: msg, unread: 0 });
      }
      if (rId === meStr && !msg.read) {
        convMap.get(key).unread++;
      }
    }

    return res.json([...convMap.values()]);
  } catch (err) {
    return next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, read: false });
    return res.json({ count });
  } catch (err) {
    return next(err);
  }
};

const getThread = async (req, res, next) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: me, recipient: other },
        { sender: other, recipient: me },
      ],
    })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany({ sender: other, recipient: me, read: false }, { $set: { read: true } });

    return res.json(messages);
  } catch (err) {
    return next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const me = req.user._id;
    const other = req.params.userId;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const recipient = await User.findById(other).select('_id');
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    const msg = await Message.create({
      sender: me,
      recipient: other,
      content: censor(content.trim()),
    });

    const populated = await Message.findById(msg._id).populate('sender', 'name role').lean();
    return res.status(201).json(populated);
  } catch (err) {
    return next(err);
  }
};

module.exports = { getConversations, getUnreadCount, getThread, sendMessage };
