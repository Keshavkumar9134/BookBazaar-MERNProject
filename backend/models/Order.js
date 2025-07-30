// backend/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who placed the order
  items: [
    {
      bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true }, // Reference to the book
      quantity: { type: Number, required: true }, // Quantity of the book
      price: { type: Number, required: true }, // Price of the book at the time of purchase
    },
  ],
  total: { type: Number, required: true }, // Total price of the order
  createdAt: { type: Date, default: Date.now }, // Order creation date
});

module.exports = mongoose.model('Order', OrderSchema);