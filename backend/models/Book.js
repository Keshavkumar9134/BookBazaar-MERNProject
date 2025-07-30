const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },  // original price
  salePrice: { type: Number },               // discounted price
  discount: { type: Number },                // discount percentage (optional)
  coverImage: { type: String },
  genre: { type: String, required: true },
  quantity: { type: Number, default: 0, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);