import React, { useState, useEffect } from 'react';
import '../App.css'; // Make sure this path is correct for your project structure

function BookGallery() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/books`);
      if (!response.ok) throw new Error('Network response was not ok.');
      const data = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books: ", error);
    }
  };

  // Helper function to render star ratings using character entities
  const renderStarRating = (rating) => {
    let stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(<i key={`star-${i}`} className="fa fa-star full-star-book-gallery" style={{color: 'orange', fontSize: '0.9rem'}}></i>);
    }
    if (rating % 1 !== 0) {
      stars.push(<i key="half-star" className="fa fa-star-half-stroke half-star-book-gallery" style={{color: 'orange', fontSize: '0.9rem'}}></i>);
    }
    return <div style={{display: 'flex', alignItems: 'center', marginRight: '10px'}}>{stars}</div>;
  };

  return (
    <div className="gallery-book-gallery">
      {books.map((book, index) => (
        <div key={index} className="item-book-gallery">
          <div className="image-book-gallery">
            {book.bookImage && (
              <>
                <img src={book.bookImage} alt={`Cover of ${book.title}`} />
                <div className="title-book-gallery">{book.title}</div>
                <span className="author-book-gallery">by {book.author}</span>
                <div className="ratings-and-review-book-gallery">
                  {book.amazonStarRating !== 'Unknown' && (
                    <div className="star-rating-book-gallery">
                      {renderStarRating(book.amazonStarRating)}
                    </div>
                  )}
                  {book.amazonReviewCount !== 'Unknown' && (
                    <span className="review-count-book-gallery">{book.amazonReviewCount} reviews</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


export default BookGallery;
