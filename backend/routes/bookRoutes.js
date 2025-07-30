const express = require('express');
const Book = require('../models/Book');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ GET all books — supports ?sale=true, ?genre=..., ?sort=newest
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const sort = {};

    // Sale filter: only books with discount > 1
    if (req.query.sale === 'true') {
      filter.discount = { $gt: 0 };
    }

    // Genre filter
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: 'i' };
    }

    // Sort newest
    if (req.query.sort === 'newest') {
      sort.createdAt = -1;
    }

    const books = await Book.find(filter).sort(sort);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ SEARCH by title (separate)
router.get('/search', async (req, res) => {
  const { title } = req.query;
  try {
    const books = await Book.find({
      title: { $regex: title, $options: 'i' },
    });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ ADD new book (admin only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  const {
    title,
    author,
    description,
    price,
    coverImage,
    genre,
    quantity,
  } = req.body;

  const book = new Book({
    title,
    author,
    description,
    price,
    coverImage,
    genre,
    quantity,
  });

  try {
    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ UPDATE book (admin only)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  const {
    title,
    author,
    description,
    price,
    coverImage,
    genre,
    quantity,
  } = req.body;

  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      {
        title,
        author,
        description,
        price,
        coverImage,
        genre,
        quantity,
      },
      { new: true }
    );
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ INCREMENT quantity (auth only)
router.put('/:id/increment-quantity', authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.quantity += quantity;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ REDUCE quantity (auth only)
router.put('/:id/reduce-quantity', authMiddleware, async (req, res) => {
  const { quantity } = req.body;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (book.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient quantity' });
    }

    book.quantity -= quantity;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ DELETE book (admin only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ PUT book ON SALE (admin only)
router.patch('/:id/sale', authMiddleware, isAdmin, async (req, res) => {
  const { discount } = req.body;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.discount = discount;
    book.salePrice = Math.round(book.price * (1 - discount / 100));
    await book.save();

    res.json({ message: 'Book put on sale', book });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ REMOVE SALE (admin only)
router.patch('/:id/remove-sale', authMiddleware, isAdmin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.discount = 0;
    book.salePrice = undefined;
    await book.save();

    res.json({ message: 'Sale removed', book });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;