import React, { useContext, useMemo, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';
import './CheckoutTheme.css';
import { apiUrl } from '../api';

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const mapSrc = useMemo(() => {
    if (!locationData) {
      return '';
    }

    const { latitude, longitude } = locationData;
    const offset = 0.01;
    const bbox = [
      longitude - offset,
      latitude - offset,
      longitude + offset,
      latitude + offset,
    ].join('%2C');

    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  }, [locationData]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationData({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
          source: 'browser-geolocation',
        });
        setIsLocating(false);
      },
      (error) => {
        setLocationError(error.message || 'Unable to fetch your location.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleBuyNow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.token) throw new Error('User not logged in');
      if (!locationData) {
        setLocationError('Please use your location before placing the order.');
        return;
      }

      setIsSubmitting(true);
      await axios.post(
        apiUrl('/api/cart/checkout'),
        { deliveryLocation: locationData },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrderDetails({
        cart: JSON.parse(JSON.stringify(cart)),
        subtotal,
        tax,
        discount,
        total,
        deliveryLocation: locationData,
      });
      setOrderConfirmed(true);
      clearCart();
    } catch (err) {
      setLocationError(err.response?.data?.message || 'Checkout failed. Please try again.');
      console.error('Checkout error:', err.response?.data || err.message);
    } finally {
      setIsSubmitting(false);
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

          <div className="location-box">
            <div className="location-header">
              <h3>Delivery Location</h3>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUseMyLocation}
                disabled={isLocating}
              >
                {isLocating ? 'Locating...' : 'Use My Location'}
              </button>
            </div>
            <p className="location-copy">
              Capture your current browser location before placing the order.
            </p>
            {locationData ? (
              <>
                <div className="location-meta">
                  <span>Latitude: {locationData.latitude}</span>
                  <span>Longitude: {locationData.longitude}</span>
                  <span>
                    Accuracy: {locationData.accuracy ? `${locationData.accuracy} m` : 'Unavailable'}
                  </span>
                </div>
                <div className="map-frame">
                  <iframe
                    title="Delivery location map"
                    src={mapSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </>
            ) : (
              <p className="location-pending">Location not captured yet.</p>
            )}
            {locationError && <p className="location-error">{locationError}</p>}
          </div>

          <div className="checkout-actions">
            <button onClick={() => navigate('/cart')} className="btn-secondary">Back</button>
            <button onClick={handleBuyNow} className="btn-primary" disabled={isSubmitting || isLocating}>
              {isSubmitting ? 'Placing Order...' : 'Buy Now'}
            </button>
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
            {orderDetails.deliveryLocation && (
              <div className="summary-box">
                <h3>Saved Delivery Location</h3>
                <p>Latitude: {orderDetails.deliveryLocation.latitude}</p>
                <p>Longitude: {orderDetails.deliveryLocation.longitude}</p>
              </div>
            )}
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
