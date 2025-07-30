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
      // If the book already exists, increase its quantity
      existingItem.quantity += quantity;
    } else {
      // If the book is new, add it to the cart with the specified quantity
      user.cart.push({ bookId, quantity });
    }

    await user.save();
    res.json(user.cart); // Return the updated cart
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
          // If the quantity is greater than 1, decrement it
          existingItem.quantity -= 1;
        } else {
          // If the quantity is 1, remove the item from the cart
          user.cart = user.cart.filter((item) => item.bookId.toString() !== bookId);
        }
      }
  
      await user.save();
      res.json(user.cart); // Return the updated cart
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
// Clear the user's cart
router.post('/clear', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      user.cart = []; // Clear the cart
      await user.save();
      res.json(user.cart); // Return the updated cart
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // checkout
  router.post('/checkout', authMiddleware, async (req, res) => {
    try {
      console.log('Checkout request received for user:', req.user.id); // Log the user ID
      const user = await User.findById(req.user.id).populate('cart.bookId');
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      console.log('User cart:', user.cart); // Log the user's cart
  
      // Reduce the quantity of each book in the cart
      for (const item of user.cart) {
        console.log('Processing cart item:', item); // Log the cart item
        const book = await Book.findById(item.bookId._id);
        if (!book) {
          console.error('Book not found:', item.bookId._id); // Log if book is not found
          continue;
        }
        console.log(`Reducing quantity for book ${book.title} by ${item.quantity}`); // Log book details
        book.quantity -= item.quantity; // Reduce the quantity
        await book.save();
      }

      // Calculate the total price of the order
    const total = user.cart.reduce((sum, item) => sum + item.bookId.price * item.quantity, 0);

    // Create a new order
    const order = new Order({
      userId: req.user.id,
      items: user.cart.map((item) => ({
        bookId: item.bookId._id,
        quantity: item.quantity,
        price: item.bookId.price,
      })),
      total,
    });

    // Save the order to the database
    await order.save();
  
      // Clear the user's cart
      user.cart = [];
      await user.save();
  
      res.json({ message: 'Checkout successful' });
    } catch (err) {
      console.error('Checkout error:', err); // Log the error
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;