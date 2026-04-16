const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

const toUserSummary = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
});

router.get('/users', authMiddleware, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = {
      _id: { $ne: req.user.id },
      isVerified: true,
      role: 'user',
    };

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('username email role')
      .sort({ username: 1 })
      .limit(25);

    res.json(users.map(toUserSummary));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/admin-support', authMiddleware, async (req, res) => {
  try {
    const admins = await User.find({
      _id: { $ne: req.user.id },
      isVerified: true,
      role: 'admin',
    })
      .select('username email role')
      .sort({ username: 1 })
      .limit(10);

    res.json(admins.map(toUserSummary));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
