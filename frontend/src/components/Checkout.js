import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();

  const subtotal = cart.reduce((total, item) => {
    const price = item.bookId.salePrice && item.bookId.salePrice < item.bookId.price
      ? item.bookId.salePrice
      : item.bookId.price;
    return total + price * item.quantity;
  }, 0);

  const tax = subtotal * 0.12;
  const discount = subtotal > 1000 ? subtotal * 0.05 : 0;
  const total = subtotal + tax - discount;

  const handleBuyNow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.token) throw new Error('User not logged in');

      await axios.post(
        'http://localhost:5000/api/cart/checkout',
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrderDetails({ cart: JSON.parse(JSON.stringify(cart)), subtotal, tax, discount, total });
      setOrderConfirmed(true);
      clearCart();
    } catch (err) {
      console.error('Checkout error:', err.response?.data || err.message);
    }
  };

  return (
    <div className="checkout">
      {!orderConfirmed ? (
        <>
          <h1 className="checkout-title">Checkout</h1>
          <img
            src="https://cdn-icons-png.flaticon.com/512/11181/11181359.png"
            alt="Checkout"
            className="checkout-logo"
          />
          <div className="cart-items-container">
            {cart.map((item) => {
              const price =
                item.bookId.salePrice && item.bookId.salePrice < item.bookId.price
                  ? item.bookId.salePrice
                  : item.bookId.price;
              return (
                <div className="cart-card" key={item.bookId._id}>
                  <img src={item.bookId.coverImage} alt={item.bookId.title} />
                  <div className="cart-details">
                    <h2>{item.bookId.title}</h2>
                    <p>Author: {item.bookId.author}</p>
                    <p>
                      Price:{' '}
                      {item.bookId.salePrice && item.bookId.salePrice < item.bookId.price ? (
                        <>
                          <span className="strikethrough">₹{item.bookId.price}</span>{' '}
                          <span className="highlight">₹{item.bookId.salePrice}</span>
                        </>
                      ) : (
                        <>₹{item.bookId.price}</>
                      )}
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Total: ₹{item.quantity * price}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box">
            <h3>Order Summary</h3>
            <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
            <p>Tax (12%): ₹{tax.toFixed(2)}</p>
            <p>Discount (5%): ₹{discount.toFixed(2)}</p>
            <h3>Total: ₹{total.toFixed(2)}</h3>
          </div>

          <div className="checkout-actions">
            <button onClick={() => navigate('/cart')} className="btn-secondary">Back</button>
            <button onClick={handleBuyNow} className="btn-primary">Buy Now</button>
          </div>
        </>
      ) : (
        <div className="order-confirmation">
          <h2>✅ Order Confirmed!</h2>
          <p>Thank you for your purchase.</p>
          <div className="order-summary">
            <h3>Items Ordered:</h3>
            {orderDetails.cart.map((item) => {
              const price =
                item.bookId.salePrice && item.bookId.salePrice < item.bookId.price
                  ? item.bookId.salePrice
                  : item.bookId.price;
              return (
                <div className="order-item" key={item.bookId._id}>
                  <img src={item.bookId.coverImage} alt={item.bookId.title} />
                  <div>
                    <h4>{item.bookId.title}</h4>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: ₹{price}</p>
                    <p>Total: ₹{item.quantity * price}</p>
                  </div>
                </div>
              );
            })}
            <div className="summary-box">
              <p>Subtotal: ₹{orderDetails.subtotal.toFixed(2)}</p>
              <p>Tax: ₹{orderDetails.tax.toFixed(2)}</p>
              <p>Discount: ₹{orderDetails.discount.toFixed(2)}</p>
              <h3>Total Paid: ₹{orderDetails.total.toFixed(2)}</h3>
            </div>
          </div>
          <button onClick={() => navigate('/shop')} className="btn-primary">
            Continue Shopping
          </button>
        </div>
      )}
    </div>
  );
};

export default Checkout;