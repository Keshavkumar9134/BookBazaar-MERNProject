import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Fetch the user's cart from the backend
  const fetchCart = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: {
          Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
        },
      });
      setCart(response.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  // Add a book to the user's cart and reduce the book quantity
  const addToCart = async (bookId, quantity = 1) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/cart/add',
        { bookId, quantity },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          },
        }
      );
      fetchCart(); // Refresh the cart after adding a book

      // Reduce the book quantity in the backend
      await axios.put(
        `http://localhost:5000/api/books/${bookId}/reduce-quantity`,
        { quantity: 1 }, // Reduce quantity by 1
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          },
        }
      );
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  // Remove a book from the user's cart and increment the book quantity
  const removeFromCart = async (bookId) => {
    try {
      // Ensure bookId is a string (extract _id if bookId is an object)
      const bookIdString = typeof bookId === 'object' ? bookId._id : bookId;
      console.log('Removing book from cart. Book ID:', bookIdString);
  
      await axios.post(
        'http://localhost:5000/api/cart/remove',
        { bookId: bookIdString },
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          },
        }
      );
      fetchCart(); // Refresh the cart after removing a book
  
      // Increment the book quantity in the backend
      console.log('Incrementing quantity for book ID:', bookIdString);
      await axios.put(
        `http://localhost:5000/api/books/${bookIdString}/increment-quantity`,
        { quantity: 1 }, // Increment quantity by 1
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          },
        }
      );
    } catch (err) {
      console.error('Error removing from cart:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      } else if (err.request) {
        console.error('Request:', err.request);
      } else {
        console.error('Error:', err.message);
      }
    }
  };

// Clear the user's cart and increment all book quantities
const clearCart = async () => {
    try {
      console.log('Clearing cart...');
  
      // Create a copy of the cart to avoid modifying the original array while iterating
      const cartCopy = [...cart];
  
      // Iterate over each item in the cart
      for (const item of cartCopy) {
        // Remove the book one by one until its quantity becomes 0
        while (item.quantity > 0) {
          await removeFromCart(item.bookId);
          item.quantity -= 1; // Decrement the quantity locally
        }
      }
  
      console.log('Cart cleared successfully.');
      fetchCart(); // Refresh the cart after clearing
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const checkout = async () => {
    try {
      console.log('Checking out...');
  
      // Clear the cart in the backend
      await axios.post(
        'http://localhost:5000/api/cart/clear',
        {},
        {
          headers: {
            Authorization: `Bearer ${JSON.parse(localStorage.getItem('user')).token}`,
          },
        }
      );
  
      console.log('Checkout successful.');
      fetchCart(); // Refresh the cart after checkout
    } catch (err) {
      console.error('Error during checkout:', err);
    }
  };

  // Fetch the cart when the component mounts
  useEffect(() => {
    if (localStorage.getItem('user')) {
      fetchCart();
    }
  }, []);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, checkout, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;