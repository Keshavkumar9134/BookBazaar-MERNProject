import React from 'react';
import './About.css';
import './AboutTheme.css';
import Header from './Header';

const About = () => {
  return (
    <>
      <Header />
      <div className="about-page">
        <div className="about-content">
          <h1 className="neon-title">About BookShope</h1>

          <p className="about-text">
            At <strong>BookShope</strong>, we believe that books are more than just pages —
            they are portals to imagination, knowledge, and personal growth. Our mission is to
            create a cozy, vibrant space where readers of all genres can find something that speaks to them.
          </p>

          <p className="about-text">
            Whether you're a fan of thrilling fiction, inspiring biographies, or deep academic reads, BookShope
            is your go-to destination. We are committed to fostering a love of reading and building a
            community around it.
          </p>

          <p className="about-text">
            Founded by book lovers, for book lovers — we are continuously evolving to serve you better.
          </p>

          {/* ✅ Vision Section */}
          <div className="about-vision">
            <h2 className="vision-heading">Our Vision</h2>
            <p className="about-text">
              We envision a world where literature is accessible, inclusive, and cherished by all. BookShope aims
              to bridge the gap between classic wisdom and contemporary curiosity, making reading a lifelong habit
              through technology, community, and creativity.
            </p>
            <p className="about-text">
              As we grow, we’re dedicated to integrating smarter recommendations, richer experiences, and a platform
              where every reader—from a casual browser to a passionate collector—feels at home.
            </p>
          </div>

         
           </div>
           </div>
    </>
  );
};

export default About;
