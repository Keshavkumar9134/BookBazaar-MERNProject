import React, { useContext, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import './Cart.css';
import { useNavigate } from 'react-router-dom';

const Cart = () => {
  const { cart, removeFromCart, clearCart, fetchCart } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <img
          src="https://icons.veryicon.com/png/o/miscellaneous/flower-mall-color-icon/shopping-cart-114.png"
          alt="Cart Logo"
          className="cart-logo"
        />
      </div>

      <button 
        className="continue-shopping-btn"
        onClick={() => navigate('/shop')}
      >
        Continue Shopping
      </button>

      {cart.length === 0 ? (
        <p className="empty-cart">Your cart is empty.</p>
      ) : (
        <div className="cart-items">
          {cart.map((item) => (
            <div key={item.bookId._id} className="cart-item">
              <img
                src={item.bookId.coverImage || 'https://via.placeholder.com/150'}
                alt={item.bookId.title}
              />
              <div className="book-details">
                <h2>{item.bookId.title}</h2>
                <p>{item.bookId.author}</p>
                <p>
                  {item.bookId.salePrice && item.bookId.salePrice < item.bookId.price ? (
                    <>
                      <span style={{ textDecoration: 'line-through', color: 'red' }}>
                        ₹{item.bookId.price}
                      </span>{' '}
                      <span style={{ fontWeight: 'bold', color: 'green' }}>
                        ₹{item.bookId.salePrice}
                      </span>
                    </>
                  ) : (
                    <>₹{item.bookId.price}</>
                  )}
                </p>
                <p>Quantity: {item.quantity}</p>
                <button onClick={() => removeFromCart(item.bookId._id)}>Remove One</button>
              </div>
            </div>
          ))}

          <p className="total-price">
            Total: ₹
            {cart.reduce((total, item) => {
              const price =
                item.bookId.salePrice && item.bookId.salePrice < item.bookId.price
                  ? item.bookId.salePrice
                  : item.bookId.price;
              return total + price * item.quantity;
            }, 0)}
          </p>

          <div className="cart-actions">
            <button
              className="checkout-button"
              onClick={() => navigate('/checkout')}
              disabled={cart.length === 0}
            >
              Proceed to Checkout
            </button>
            <button
              className="clear-cart-button"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;