import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './PutOnSale.css';

const PutOnSale = () => {
  const [books, setBooks] = useState([]);
  const [discounts, setDiscounts] = useState({});
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books');
      setBooks(response.data);

      // ✅ Pre-fill discounts with existing discount from DB
      const initialDiscounts = {};
      response.data.forEach(book => {
        initialDiscounts[book._id] = book.discount || ''; // If no discount, use empty string
      });
      setDiscounts(initialDiscounts);

    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  const handleDiscountChange = (bookId, value) => {
    setDiscounts({
      ...discounts,
      [bookId]: value
    });
  };

  const handlePutOnSale = async (bookId) => {
    try {
      const discount = discounts[bookId];
      if (!discount || discount <= 0 || discount >= 100) {
        alert('Please enter a valid discount percentage (1-99).');
        return;
      }

      await axios.patch(
        `http://localhost:5000/api/books/${bookId}/sale`,
        { discount: discount },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert('Book marked as On Sale!');
      fetchBooks();
    } catch (err) {
      console.error('Error putting book on sale:', err);
    }
  };

  const handleRemoveSale = async (bookId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/books/${bookId}/remove-sale`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert('Sale removed from book!');
      fetchBooks();
    } catch (err) {
      console.error('Error removing sale:', err);
    }
  };

  return (
    <div className="put-on-sale-page">
      <h1>Put Books On Sale</h1>
      <button className="back-button" onClick={() => navigate('/admin')}>
        Back to Dashboard
      </button>
      <div className="sale-book-list">
        {books.map((book) => (
          <div key={book._id} className="sale-book-item">
            <img src={book.coverImage} alt={book.title} className="sale-book-image" />
            <div className="sale-book-info">
              <h3>{book.title}</h3>
              <p>
                Original Price: ₹{book.price}
                {book.salePrice && (
                  <> | Sale Price: ₹{book.salePrice} ({book.discount}% off)</>
                )}
              </p>
              <input
                type="number"
                placeholder="Discount %"
                value={discounts[book._id] || ''}
                onChange={(e) => handleDiscountChange(book._id, e.target.value)}
                min="1"
                max="99"
              />
              <button className="apply-button" onClick={() => handlePutOnSale(book._id)}>
                Apply Sale
              </button>
              <button className="remove-button" onClick={() => handleRemoveSale(book._id)}>
                Remove Sale
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PutOnSale;