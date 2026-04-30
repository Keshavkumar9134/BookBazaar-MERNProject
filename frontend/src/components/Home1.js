import React from 'react';
import Header from './Header';
import './Home1.css';
import { useNavigate } from 'react-router-dom';

const Home1 = () => {
  const navigate = useNavigate();

  return (
    <div>
      <Header />
      <div className="home1-body">
        <h3>Welcome to</h3>
        <h1>BookGenie</h1>
        <p>A cozy corner for every reader.</p>

        <div
  id="carouselExampleCaptions"
  className="carousel slide"
  data-bs-ride="carousel"
  data-bs-interval="3000" 
>
  <div className="carousel-indicators">
    <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2" aria-label="Slide 3"></button>
  </div>
  <div className="carousel-inner">
    <div className="carousel-item active">
      <img src="https://www.shutterstock.com/image-vector/promo-sale-banner-bookstore-bookshop-260nw-1971130367.jpg" className="d-block w-100" alt="Colorful bookstore sale banner with stacks of books and promotional text, creating a lively and energetic atmosphere" />
      
    </div>
    <div className="carousel-item">
      <img src="https://pen.org/wp-content/uploads/2024/12/Top-Banned-Books-2024-Banner-jpg.webp" className="d-block w-100" alt="Paperback books displayed in a neat row with Penguin Random House branding, evoking a sense of discovery and excitement for new reads" />
      
    </div>
    <div className="carousel-item">
      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjWaAWAf1f1V6l4aprfEE5q5MhxD-ZESkyWQ&s" className="d-block w-100" alt="Brightly illustrated online science library banner featuring books, a smartphone, and educational icons, conveying a modern and engaging learning environment" />
      
    </div>
  </div>
  <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
    <span className="visually-hidden">Previous</span>
  </button>
  <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
    <span className="carousel-control-next-icon" aria-hidden="true"></span>
    <span className="visually-hidden">Next</span>
  </button>
</div>

        <div className="promo-container">
          <div className="promo-card">
            <div className="promo-image">
              <img src="/Image/booksale.jpg" alt="Sale" />
            </div>
            <div className="promo-content">
              <div className="promo-title">Sale</div>
              <button
                className="promo-button"
                onClick={() => navigate('/shop?sale=true')}
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="promo-card">
            <div className="promo-image">
              <img className="promo-img" src="/Image/newarival.jpg" alt="New Arrivals" />
            </div>
            <div className="promo-content">
              <div className="promo-title">New Arrivals</div>
              <button
                className="promo-button"
                onClick={() => navigate('/shop?sort=newest')}
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="promo-card">
            <div className="promo-image">
              <img className="promo-img" src="/Image/more.jpg" alt="Book Collection" />
            </div>
            <div className="promo-content">
              <div className="promo-title">Book Collection</div>
              <button
                className="promo-button"
                onClick={() => navigate('/shop')}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        <div className="genre-container">
          <div className="genre-box" onClick={() => navigate('/shop?genre=Fiction')}>
            <img src="/Image/fiction.jpg" alt="Fiction" />
            <div className="genre-label">Fiction</div>
          </div>
          <div className="genre-box" onClick={() => navigate('/shop?genre=Sci-Fi')}>
            <img src="/Image/scifi.jpg" alt="Sci-Fi" />
            <div className="genre-label">Sci-Fi</div>
          </div>
          <div className="genre-box" onClick={() => navigate('/shop?genre=Romance')}>
            <img src="/Image/romance.jpg" alt="Romance" />
            <div className="genre-label">Romance</div>
          </div>
          <div className="genre-box" onClick={() => navigate('/shop?genre=Non-Fiction')}>
            <img src="/Image/nonfic.jpg" alt="Non-Fiction" />
            <div className="genre-label">Non-Fiction</div>
          </div>
          <div className="genre-box" onClick={() => navigate('/shop?genre=Horror')}>
            <img src="/Image/horror.jpg" alt="Horror" />
            <div className="genre-label">Horror</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home1;
