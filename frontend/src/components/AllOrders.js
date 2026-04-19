import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AllOrders.css';
import { apiUrl } from '../api';

const AllOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filterUser, setFilterUser] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const mapLink = (location) =>
    `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        const response = await axios.get(apiUrl('/api/all-orders'), {
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

  const filteredOrders = orders.filter((order) =>
    order.userId?.username?.toLowerCase().includes(filterUser.toLowerCase())
  );

  return (
    <div className="all-orders">
            <h1>All Orders</h1>

      <button className="back-button" onClick={() => navigate('/admin')}>
        Back to Dashboard
      </button>

      <div className='search-Orders-container'>
      <input
        type="text"
        name='searchFliterOrders'
        placeholder="Filter by username..."
        value={filterUser}
        onChange={(e) => setFilterUser(e.target.value)}
        className="filter-input"
      />
      </div>

      {filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul>
          {filteredOrders.map((order) => (
            <li key={order._id} className="order-item">
              <h2>Order ID: {order._id}</h2>
              <p><strong>User: </strong> {order.userId?.username || 'Unknown User'}</p>
              <p><strong>Date: </strong> {new Date(order.createdAt).toLocaleDateString()}</p>
              <p><strong>Total: </strong>Rs.{order.total.toFixed(2)}</p>
              <p>
                <strong>Payment: </strong> {order.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
              </p>
              {order.deliveryLocation?.latitude && order.deliveryLocation?.longitude ? (
                <>
      
                  <p><strong>Address:</strong> {order.deliveryLocation.addressText || 'No manual address saved'}</p>
                  <p>
                    <strong>Coords:</strong> {order.deliveryLocation.latitude}, {order.deliveryLocation.longitude}
                  </p>
                  <p>
                    <strong>Accuracy:</strong> {order.deliveryLocation.accuracy
                      ? `${order.deliveryLocation.accuracy} m`
                      : 'Unavailable'}
                  </p>
                  <p>
                    <a href={mapLink(order.deliveryLocation)} target="_blank" rel="noreferrer">
                      Open in Map
                    </a>
                  </p>
                </>
              ) : (
                <p>Location: Not captured</p>
              )}
              <ul>
                {order.items
                  .filter((item) => item.bookId)
                  .map((item) => (
                    <li key={item.bookId._id}>
                      {item.bookId.title} - {item.quantity} x Rs. {item.bookId.price}
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
