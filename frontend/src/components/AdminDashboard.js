import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UpdateBookForm from './UpdateBookForm';
import './AdminDashboard.css';
import AdminSearchBar from './AdminSearchBar';
import AdminFilterBar from './AdminFilterBar';

const AdminDashboard = () => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: '',
    description: '',
    price: '',
    coverImage: '',
    quantity: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/books');
      setBooks(response.data);
      setFilteredBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    let result = books;

    if (searchQuery) {
      result = result.filter((book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre) {
      result = result.filter(
        (book) => book.genre.toLowerCase() === selectedGenre.toLowerCase()
      );
    }

    setFilteredBooks(result);
  }, [searchQuery, selectedGenre, books]);

  const handleDeleteBook = async (bookId) => {
    try {
      await axios.delete(`http://localhost:5000/api/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      fetchBooks();
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  const handleUpdateClick = (book) => {
    setSelectedBook(book);
  };

  const handleUpdateComplete = () => {
    setSelectedBook(null);
    fetchBooks();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (title) => {
    setSearchQuery(title);
  };

  const handleFilter = (genre) => {
    setSelectedGenre(genre);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="button-container">
          <button className="all-orders-button" onClick={() => navigate('/all-orders')}>
            All Orders
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="add-book-box">
        <button className="add-book-btn" onClick={() => navigate('/add-book')}>
          Add Book
        </button>
        <button className="put-on-sale-btn" onClick={() => navigate('/put-on-sale')}>
          Put on Sale
        </button>
      </div>

      <div className="book-container">
        <h2 className="book_list">Book List</h2>
        <AdminSearchBar onSearch={handleSearch} />
        <AdminFilterBar onFilter={handleFilter} />
        <div className="book-grid">
          {filteredBooks.map((book) => (
            <div key={book._id} className="book-item">
              {selectedBook && selectedBook._id === book._id ? (
                <UpdateBookForm book={selectedBook} onUpdate={handleUpdateComplete} />
              ) : (
                <div className="Book-Container">
                  <img src={book.coverImage} alt={book.title} className="Book-Image" />
                  <div className="book-details">
                    <h3 className="book_title">{book.title}</h3>
                    <p className="book_author">{book.author}</p>
                    <p className="book_genre">{book.genre}</p>
                    <p className="book_desc">{book.description}</p>
                    <p className="book_price">₹{book.price}</p>
                    <p className="book_quantity">Quantity: {book.quantity}</p>
                    <div className="button-row">
                      <button
                        onClick={() => handleDeleteBook(book._id)}
                        className="book-delete-btn"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleUpdateClick(book)}
                        className="book-update-button"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;