import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AllOrders.css';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filterUser, setFilterUser] = useState(''); // ✅ new state for user name filter
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/all-orders', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setOrders(response.data);
      } catch (err) {
        console.error('Error fetching all orders:', err);
      }
    };

    if (user) {
      fetchAllOrders();
    }
  }, [user]);

  // ✅ Filter orders based on filterUser
  const filteredOrders = orders.filter((order) =>
    order.userId?.username?.toLowerCase().includes(filterUser.toLowerCase())
  );

  return (
    <div className="all-orders">
      <button className="back-button" onClick={() => navigate('/admin')}>
        Back to Dashboard
      </button>
      <h1>All Orders</h1>

      {/* ✅ Search input */}
      <input
        type="text"
        placeholder="Filter by username..."
        value={filterUser}
        onChange={(e) => setFilterUser(e.target.value)}
        className="filter-input"
      />

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {filteredOrders.map((order) => (
            <li key={order._id} className="order-item">
              <h2>Order ID: {order._id}</h2>
              <p>User: {order.userId?.username || 'Unknown User'}</p>
              <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p>Total: ₹{order.total.toFixed(2)}</p>
              <ul>
                {order.items
                  .filter((item) => item.bookId)
                  .map((item) => (
                    <li key={item.bookId._id}>
                      {item.bookId.title} - {item.quantity} x ₹{item.bookId.price}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AllOrders;