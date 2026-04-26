import React, { useContext, useMemo, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';
import './CheckoutTheme.css';
import { apiUrl } from '../api';

const SAVED_ADDRESS_KEY = 'bookbazzar_saved_checkout_address';

const getSavedAddress = () => {
  try {
    const saved = localStorage.getItem(SAVED_ADDRESS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Unable to read saved checkout address:', error);
    return null;
  }
};

const formatCurrency = (value) => `Rs. ${value.toFixed(2)}`;

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const initialSavedAddress = getSavedAddress();
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [locationData, setLocationData] = useState(initialSavedAddress);
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressInput, setAddressInput] = useState(initialSavedAddress?.addressText || '');
  const [isAddressSaved, setIsAddressSaved] = useState(Boolean(initialSavedAddress));
  const [isOrderReviewed, setIsOrderReviewed] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const navigate = useNavigate();

  const subtotal = cart.reduce((total, item) => {
    const price = item.bookId.salePrice && item.bookId.salePrice < item.bookId.price
      ? item.bookId.salePrice
      : item.bookId.price;
    return total + price * item.quantity;
  }, 0);

  const tax = subtotal * 0.18;
  const discount = subtotal > 1000 ? subtotal * 0.05 : 0;
  const total = subtotal + tax - discount;

  const hasAddressDraft = Boolean(addressInput.trim());
  const savedAddressText = locationData?.addressText || addressInput.trim() || '';

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

  const resolvePlaceName = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed.');
      }

      const data = await response.json();
      return data.display_name || 'Current location detected';
    } catch (error) {
      console.error('Unable to resolve place name:', error);
      return 'Current location detected';
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        const placeName = await resolvePlaceName(latitude, longitude);

        setLocationData({
          latitude,
          longitude,
          accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
          source: 'browser-geolocation',
          placeName,
          addressText: placeName,
        });
        setAddressInput(placeName);
        setIsAddressSaved(false);
        setIsOrderReviewed(false);
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

  const handleSaveAddress = () => {
    const wasSavedAlready = isAddressSaved;
    const finalAddress = addressInput.trim();

    if (!finalAddress) {
      setLocationError('Please write an address or use your current location before saving.');
      return;
    }

    const addressToSave = {
      ...(locationData || {}),
      addressText: finalAddress,
      source: locationData?.latitude && locationData?.longitude
        ? locationData.source || 'browser-geolocation'
        : 'manual-entry',
    };

    setLocationData(addressToSave);
    setAddressInput(finalAddress);
    localStorage.setItem(SAVED_ADDRESS_KEY, JSON.stringify(addressToSave));
    setIsAddressSaved(true);
    setIsOrderReviewed(false);
    setLocationError('');
    alert(wasSavedAlready ? 'Address changed successfully!' : 'Address saved successfully!');
  };

  const handleConfirmOrder = () => {
    if (!savedAddressText) {
      setLocationError('Please save your address before confirming the order.');
      return;
    }

    setIsOrderReviewed(true);
    setLocationError('');
  };

  const handleCancelOrder = () => {
    setIsOrderReviewed(false);
    setPaymentMethod('cod');
    setLocationError('Order confirmation has been cancelled. You can edit the details and confirm again.');
  };

  const handleBuyNow = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.token) throw new Error('User not logged in');
      if (!savedAddressText) {
        setLocationError('Please save your address before placing the order.');
        return;
      }
      if (!isOrderReviewed) {
        setLocationError('Please confirm your order before making payment.');
        return;
      }

      const deliveryLocation = {
        ...(locationData || {}),
        addressText: savedAddressText,
      };

      setIsSubmitting(true);
      await axios.post(
        apiUrl('/api/cart/checkout'),
        {
          deliveryLocation,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setOrderDetails({
        cart: JSON.parse(JSON.stringify(cart)),
        subtotal,
        tax,
        discount,
        total,
        deliveryLocation,
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'Paid Online' : 'Cash on Delivery',
      });
      alert('Order placed successfully!');
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
                          <span className="strikethrough">{formatCurrency(item.bookId.price)}</span>{' '}
                          <span className="highlight">{formatCurrency(item.bookId.salePrice)}</span>
                        </>
                      ) : (
                        <>{formatCurrency(item.bookId.price)}</>
                      )}
                    </p>
                    <p>Quantity: {item.quantity}</p>
                    <p>Total: {formatCurrency(item.quantity * price)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box">
            <h3>Order Summary</h3>
            <p>Subtotal: {formatCurrency(subtotal)}</p>
            <p>Tax (18%): {formatCurrency(tax)}</p>
            <p>Discount (5%): {formatCurrency(discount)}</p>
            <h3>Total: {formatCurrency(total)}</h3>
          </div>

          <div className="location-box">
            <div className="location-header">
              <h3>Delivery Address</h3>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUseMyLocation}
                disabled={isLocating}
              >
                {isLocating ? 'Locating...' : 'Use My Current Location'}
              </button>
            </div>
            <p className="location-copy">
              Write your address manually, or use your current location to fill the same address box automatically.
            </p>

            <div className="address-panel">
              <label className="address-label" htmlFor="desired-address">
                Address Box
              </label>
              <textarea
                id="desired-address"
                className="address-input"
                placeholder="Write your house number, street, landmark, area, city, and pincode"
                value={addressInput}
                onChange={(event) => {
                  setAddressInput(event.target.value);
                  setIsAddressSaved(false);
                  setIsOrderReviewed(false);
                  setLocationError('');
                  setLocationData((current) =>
                    current
                      ? {
                          ...current,
                          addressText: event.target.value,
                        }
                      : null
                  );
                }}
                rows={4}
              />
            </div>

            {locationData?.latitude && locationData?.longitude ? (
              <div className="current-location-card">
                <div className="current-location-header">
                  <h4>Current Location</h4>
                  <span className="location-pill ready">Detected</span>
                </div>
                <div className="location-meta">
                  <span>
                    Accuracy: {locationData.accuracy ? `${locationData.accuracy} m` : 'Unavailable'}
                  </span>
                  <span>Coords: {locationData.latitude}, {locationData.longitude}</span>
                </div>
                <div className="map-frame">
                  <iframe
                    title="Delivery location map"
                    src={mapSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            ) : (
              <p className="location-pending">You can place the order with a typed address only, or use current location to auto-fill it.</p>
            )}

            {hasAddressDraft && (
              <div className="address-actions single-action">
                <button type="button" className="btn-primary" onClick={handleSaveAddress}>
                  {isAddressSaved ? 'Address Saved' : 'Save Address'}
                </button>
              </div>
            )}

            {isAddressSaved && (
              <p className="address-status saved">Address saved for this checkout.</p>
            )}
            {locationError && <p className="location-error">{locationError}</p>}
          </div>

          {isAddressSaved && (
            <div className="summary-box confirm-box">
              <h3>Confirm Order</h3>
              <p>Once confirmed, you can move to payment. If something looks wrong, cancel and update the details.</p>
              <div className="confirm-actions">
                <button type="button" className="btn-primary" onClick={handleConfirmOrder}>
                  {isOrderReviewed ? 'Order Confirmed' : 'Confirm Order'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleCancelOrder}>
                  Cancel Order
                </button>
              </div>
            </div>
          )}

          {isOrderReviewed && (
            <div className="summary-box payment-box active">
              <div className="payment-heading-row">
                <h3>Payment Method</h3>
                <span className="payment-step-tag">Final Step</span>
              </div>
              <p>Select the method you want to use for this order.</p>
              <div className="payment-grid">
                <label className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="payment-radio" aria-hidden="true" />
                  <div>
                    <h4>Cash on Delivery</h4>
                    <p>Pay when your books arrive at your address.</p>
                  </div>
                </label>
                <label className={`payment-card ${paymentMethod === 'online' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="payment-radio" aria-hidden="true" />
                  <div>
                    <h4>Online Payment</h4>
                    <p>Complete payment now and mark the order as paid.</p>
                  </div>
                </label>
              </div>
              <p className="payment-note">
                {paymentMethod === 'online'
                  ? 'Online payment is marked as completed when the order is placed.'
                  : 'For COD, payment will be collected at delivery.'}
              </p>
            </div>
          )}

          <div className="checkout-actions">
            <button onClick={() => navigate('/cart')} className="btn-secondary">Back</button>
            {isOrderReviewed && (
              <button onClick={handleBuyNow} className="btn-primary" disabled={isSubmitting || isLocating}>
                {isSubmitting ? 'Placing Order...' : 'Pay & Place Order'}
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="order-confirmation">
          <h2>Order Confirmed!</h2>
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
                    <p>Price: {formatCurrency(price)}</p>
                    <p>Total: {formatCurrency(item.quantity * price)}</p>
                  </div>
                </div>
              );
            })}
            <div className="summary-box">
              <p>Subtotal: {formatCurrency(orderDetails.subtotal)}</p>
              <p>Tax: {formatCurrency(orderDetails.tax)}</p>
              <p>Discount: {formatCurrency(orderDetails.discount)}</p>
              <h3>Total Paid: {formatCurrency(orderDetails.total)}</h3>
            </div>
            {orderDetails.deliveryLocation && (
              <div className="summary-box">
                <h3>Saved Delivery Details</h3>
                <p>Address: {orderDetails.deliveryLocation.addressText}</p>
                <p>Payment Method: {paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}</p>
                <p>Payment Status: {orderDetails.paymentStatus}</p>
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
