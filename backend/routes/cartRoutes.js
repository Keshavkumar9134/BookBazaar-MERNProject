const express = require('express');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();
const Book = require('../models/Book');
const Order = require('../models/Order');

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.bookId');
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a book to the user's cart
router.post('/add', authMiddleware, async (req, res) => {
  const { bookId, quantity } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const existingItem = user.cart.find((item) => item.bookId.toString() === bookId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ bookId, quantity });
    }

    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove a book from the user's cart
router.post('/remove', authMiddleware, async (req, res) => {
  const { bookId } = req.body;
  try {
    const user = await User.findById(req.user.id);
    const existingItem = user.cart.find((item) => item.bookId.toString() === bookId);

    if (existingItem) {
      if (existingItem.quantity > 1) {
        existingItem.quantity -= 1;
      } else {
        user.cart = user.cart.filter((item) => item.bookId.toString() !== bookId);
      }
    }

    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Clear the user's cart
router.post('/clear', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = [];
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// checkout
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { deliveryLocation, paymentMethod } = req.body;
    const user = await User.findById(req.user.id).populate('cart.bookId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!deliveryLocation.addressText || !deliveryLocation.addressText.trim()) {
      return res.status(400).json({ message: 'Delivery address is required for checkout.' });
    }
    if (!paymentMethod || !['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Please choose a valid payment method.' });
    }

    for (const item of user.cart) {
      const book = await Book.findById(item.bookId._id);
      if (!book) {
        console.error('Book not found:', item.bookId._id);
        continue;
      }
      book.quantity -= item.quantity;
      await book.save();
    }

    const total = user.cart.reduce((sum, item) => sum + item.bookId.price * item.quantity, 0);

    const order = new Order({
      userId: req.user.id,
      items: user.cart.map((item) => ({
        bookId: item.bookId._id,
        quantity: item.quantity,
        price: item.bookId.price,
      })),
      total,
      deliveryLocation: {
        latitude: typeof deliveryLocation.latitude === 'number' ? deliveryLocation.latitude : null,
        longitude: typeof deliveryLocation.longitude === 'number' ? deliveryLocation.longitude : null,
        accuracy: deliveryLocation.accuracy ?? null,
        source: deliveryLocation.source || 'manual-entry',
        placeName: deliveryLocation.placeName || '',
        addressText: deliveryLocation.addressText.trim(),
        capturedAt: new Date(),
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'paid-online' : 'cod-pending',
    });

    await order.save();

    user.cart = [];
    await user.save();

    res.json({ message: 'Checkout successful' });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
