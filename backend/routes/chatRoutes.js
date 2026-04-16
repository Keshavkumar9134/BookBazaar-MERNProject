const express = require('express');
const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { authMiddleware, resolveAuthToken } = require('../middleware/authMiddleware');
const {
  addRealtimeClient,
  removeRealtimeClient,
  publishToUsers,
  sendEvent,
} = require('../utils/realtime');

const router = express.Router();

const toUserSummary = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

const toMessagePayload = (message) => ({
  id: message._id,
  conversationId: message.conversation,
  sender: toUserSummary(message.sender),
  recipient: toUserSummary(message.recipient),
  content: message.content,
  readAt: message.readAt,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const getConversation = (firstUserId, secondUserId) =>
  Conversation.findOne({
    participants: { $all: [firstUserId, secondUserId], $size: 2 },
  });

const findChatRecipient = async (otherUserId, currentUserId) => {
  const recipient = await User.findOne({
    _id: otherUserId,
    _id: { $ne: currentUserId },
    isVerified: true,
  }).select('username email role');

  return recipient;
};

router.get('/chat/stream', (req, res) => {
  const token = resolveAuthToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    addRealtimeClient(userId, res);
    sendEvent(res, { type: 'chat:connected', userId });

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      removeRealtimeClient(userId, res);
      res.end();
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token' });
  }
});

router.get('/chat/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id,
    })
      .populate('participants', 'username email role')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const items = await Promise.all(
      conversations.map(async (conversation) => {
        const participant = conversation.participants.find(
          (user) => String(user._id) !== String(req.user.id)
        );

        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          recipient: req.user.id,
          readAt: null,
        });

        return {
          id: conversation._id,
          participant: participant ? toUserSummary(participant) : null,
          lastMessageText: conversation.lastMessageText,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
        };
      })
    );

    res.json(items.filter((item) => item.participant));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/chat/messages/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const otherUser = await findChatRecipient(req.params.otherUserId, req.user.id);

    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const conversation = await getConversation(req.user.id, otherUser._id);

    if (!conversation) {
      return res.json({
        conversationId: null,
        participant: toUserSummary(otherUser),
        messages: [],
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'username email role')
      .populate('recipient', 'username email role')
      .sort({ createdAt: 1 });

    res.json({
      conversationId: conversation._id,
      participant: toUserSummary(otherUser),
      messages: messages.map(toMessagePayload),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/chat/messages/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const content = req.body.content?.trim();

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const otherUser = await findChatRecipient(req.params.otherUserId, req.user.id);

    if (!otherUser) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    let conversation = await getConversation(req.user.id, otherUser._id);

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, otherUser._id],
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      recipient: otherUser._id,
      content,
    });

    conversation.lastMessageText = content;
    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessageSender = req.user.id;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email role')
      .populate('recipient', 'username email role');

    const payload = {
      type: 'chat:message',
      conversationId: conversation._id,
      message: toMessagePayload(populatedMessage),
    };

    publishToUsers([req.user.id, otherUser._id], payload);

    res.status(201).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/chat/conversations/:conversationId/read', authMiddleware, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      participants: req.user.id,
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const now = new Date();
    const result = await Message.updateMany(
      {
        conversation: conversation._id,
        recipient: req.user.id,
        readAt: null,
      },
      { $set: { readAt: now } }
    );

    if ((result.modifiedCount || 0) > 0) {
      publishToUsers(conversation.participants, {
        type: 'chat:read',
        conversationId: conversation._id,
        readBy: req.user.id,
        updatedCount: result.modifiedCount || 0,
        readAt: now,
      });
    }

    res.json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
