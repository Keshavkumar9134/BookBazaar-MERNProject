import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Header from './Header';
import { AuthContext } from '../context/AuthContext';
import './OrderHistory.css'; // Optional: Add styles for this component

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        console.log('Fetching order history for user:', user);
        const response = await axios.get('http://localhost:5000/api/orders', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        console.log('Order history response:', response.data);
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching order history:', err);
      }
    }

    if (user) {
      fetchOrderHistory();
    }
  }, [user]);

  return (
    <>
      <Header />
      <div className="order-history">
        <h1>
          <img
            src="https://cdn-icons-png.flaticon.com/512/891/891462.png"
            alt="Checkout"
            className="checkout-logo"
          />
          Order History
        </h1>
        {orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order._id} className="order-item">
                <div className="order-summary-row">
                  <div>
                    <span className="order-label">Order ID:</span>
                    <span className="order-value">{order._id}</span>
                  </div>
                  <div>
                    <span className="order-label">Date:</span>
                    <span className="order-value">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="order-label">Total:</span>
                    <span className="order-value">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
                <ul className="order-books-list">
                  {order.items
                    .filter((item) => item.bookId)
                    .map((item) => (
                      <li key={item.bookId._id} className="order-book-item">
                        <span className="book-title">{item.bookId.title}</span>
                        <span className="book-qty">× {item.quantity}</span>
                        <span className="book-price">₹{item.bookId.price}</span>
                      </li>
                    ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default OrderHistory;