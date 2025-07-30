import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import './BookList.css';
import Header from './Header';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filterGenre, setFilterGenre] = useState('');
  const [searchTitle, setSearchTitle] = useState('');
  const [isNewest, setIsNewest] = useState(false);

  const { addToCart, clearCart } = useContext(CartContext);
  const { logout } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchBooks = async () => {
    try {
      const params = new URLSearchParams(location.search);
      let url = 'http://localhost:5000/api/books';

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await axios.get(url);
      setBooks(response.data);
      setFilteredBooks(response.data);

      if (!params.get('genre') && !params.get('sort') && !params.get('sale')) {
        const uniqueGenres = [...new Set(response.data.map(book => book.genre))];
        setGenres(uniqueGenres);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const genre = params.get('genre');
    const sort = params.get('sort');
    const sale = params.get('sale');

    if (books.length === 0) return;

    if (genre) {
      setFilterGenre(genre);
      applyFilters(searchTitle, genre);
      setIsNewest(false);
    } else if (sort === 'newest') {
      setIsNewest(true);
      const sortedBooks = [...books].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setFilteredBooks(sortedBooks.slice(0, 8));
    } else if (sale === 'true') {
      setIsNewest(false);
      setFilteredBooks(books);
    } else {
      setFilteredBooks(books);
      setFilterGenre('');
      setIsNewest(false);
    }
  }, [location.search, books]);

  const applyFilters = (title, genre) => {
    let filtered = books;

    if (title) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(title.toLowerCase())
      );
    }

    if (genre && genre !== 'All') {
      filtered = filtered.filter(book =>
        book.genre.toLowerCase() === genre.toLowerCase()
      );
    }

    setFilteredBooks(filtered);
  };

  const handleSearch = (title) => {
    setSearchTitle(title);
    setIsNewest(false);
    applyFilters(title, filterGenre);
  };

  const handleFilter = (genre) => {
    setFilterGenre(genre);
    setIsNewest(false);

    // Sync genre with URL
    const params = new URLSearchParams(location.search);
    if (genre === 'All') {
      params.delete('genre');
    } else {
      params.set('genre', genre);
    }

    navigate({ search: params.toString() });
    applyFilters(searchTitle, genre);
  };

  const handleAddToCart = async (bookId) => {
    await addToCart(bookId);

    const updatedBooks = books.map(book =>
      book._id === bookId && book.quantity > 0
        ? { ...book, quantity: book.quantity - 1 }
        : book
    );

    setBooks(updatedBooks);

    // Use URL params to reapply filters
    const params = new URLSearchParams(location.search);
    const genre = params.get('genre') || filterGenre || '';
    applyFilters(searchTitle, genre);

    alert('Book added to cart!');
  };

  const handleLogout = () => {
    clearCart();
    logout();
    navigate('/home1');
  };

  const params = new URLSearchParams(location.search);
  const hasGenreParam = params.get('genre');
  const hasSaleParam = params.get('sale') === 'true';

  return (
    <div>
      <Header onLogout={handleLogout} />
      <div className="book-list">
        <h1>Book List</h1>

        <SearchBar
          searchTerm={searchTitle}
          setSearchTerm={setSearchTitle}
          onSearch={handleSearch}
        />

        {!isNewest && !hasSaleParam && (
          <div className="genre-dropdown">
            <label htmlFor="genre">Select Genre: </label>
            <select
              id="genre"
              value={filterGenre}
              onChange={(e) => handleFilter(e.target.value)}
            >
              <option value="All">All</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
        )}

        {(filterGenre && filterGenre !== 'All') || searchTitle ? (
          <p className="active-filter">
            {filterGenre && filterGenre !== 'All' && (
              <span><strong>Genre:</strong> {filterGenre} </span>
            )}
            {searchTitle && (
              <span><strong>Search:</strong> {searchTitle}</span>
            )}
          </p>
        ) : null}

        {isNewest && (
          <p className="active-filter">
            <strong>Showing:</strong> Newest Arrivals
          </p>
        )}

        <div className="User_books">
          {filteredBooks.map((book) => (
            <div key={book._id} className="book">
              <table className="book-table">
                <tbody>
                  <tr className="book-image">
                    <td className="image-data">
                      <img
                        src={book.coverImage || 'https://via.placeholder.com/150'}
                        alt={book.title}
                        className="user-book-image"
                      />
                    </td>
                  </tr>
                  <tr className="book-details">
                    <td className="padding_none">
                      <h2 className="user-book-title">{book.title}</h2>
                      <p className="user-book-author">{book.author}</p>
                      <h2 className="user-book-genre">{book.genre}</h2>
                    </td>
                  </tr>
                  <tr>
                    <td className="book-desc">
                      <h2 className="user-book-desc">{book.description}</h2>
                    </td>
                  </tr>
                  <tr className="book-buttons">
                    <td className="padding_none">
                      <p className="user-book-author">
                        {book.salePrice && book.salePrice < book.price ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'red' }}>
                              ₹{book.price}
                            </span>{' '}
                            <span style={{ fontWeight: 'bold', color: 'green' }}>
                              ₹{book.salePrice}
                            </span>
                          </>
                        ) : (
                          <>₹{book.price}</>
                        )}
                      </p>
                      <p className="user-book-author">Quantity: {book.quantity}</p>
                      {book.quantity > 0 ? (
                        <button onClick={() => handleAddToCart(book._id)}>
                          Add to Cart
                        </button>
                      ) : (
                        <p style={{ color: 'red' }}>Sold Out</p>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookList;