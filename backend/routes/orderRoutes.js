const express = require('express');
const Order = require('../models/Order');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Fetch order history for the logged-in user
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('items.bookId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/all-orders', authMiddleware, isAdmin, async (req, res) => {
    try {
      const orders = await Order.find().populate({
        path: 'items.bookId',
        match: { bookId: { $ne: null } },}).populate('userId', 'username');

        const filteredOrders = orders.map((order) => ({
          ...order._doc,
          items: order.items.filter((item) => item.bookId !== null),
        }));

      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;