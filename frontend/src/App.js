import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './components/Home';
import Home1 from './components/Home1';
import Login from './components/Login';
import Register from './components/Register';
import BookList from './components/BookList';
import Cart from './components/Cart';
import AdminDashboard from './components/AdminDashboard';
import Checkout from './components/Checkout';
import OrderHistory from './components/OrderHistory';
import AllOrders from './components/AllOrders';
import AddBookForm from './components/AddBookForm';
import PutOnSale from './components/PutOnSale'; // ✅ ADDED IMPORT
import './App.css';
import About from './components/About';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home1" element={<Home1 />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/shop" element={<BookList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/all-orders" element={<AllOrders />} />
            <Route path="/add-book" element={<AddBookForm />} />
            <Route path="/about" element={<About />} />
            <Route path="/put-on-sale" element={<PutOnSale />} /> {/* ✅ NEW ROUTE */}
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;