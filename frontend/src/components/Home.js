import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sortBooks } from './CommonFunctions'; // Adjust the path as necessary

const GenreBar = ({ genres, onSelectGenre, selectedGenre }) => {
    return (
        <div className="genre-bar">
            {genres.map((genre, index) => (
                <span key={index}
                      className={`genre-item ${genre === selectedGenre ? 'selected' : ''}`}
                      onClick={() => onSelectGenre(genre)}>
                    {genre}
                </span>
            ))}
        </div>
    );
};


export const mapCountryNameToCode = (countryName) => {
    const countryMapping = {
      'India': 'IN',
      'United States': 'US'
    };
  
    return countryMapping[countryName] || null; // returns null if no match found
  };
  

const Home = ({ userData }) => {
    const [genres, setGenres] = useState([]);
    const [books, setBooks] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('All');

    const fetchGenres = useCallback(async () => {
        const countryCode = mapCountryNameToCode(userData.country);
        if (!countryCode) {
            console.error('Country not supported:', userData.country);
            return; // Early return if country is not supported
        }
        
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/distinct-genres?country=${encodeURIComponent(countryCode)}`);
            const data = await response.json();
            setGenres(['All', ...data.genres]); // Prepend 'All' to the list of genres
        } catch (error) {
            console.error('Failed to fetch genres', error);
        }
    }, [userData.country]);

    const fetchBooks = useCallback(async (genre) => {
        setSelectedGenre(genre); // Update the selected genre
        const countryCode = mapCountryNameToCode(userData.country);
        if (!countryCode) {
            console.error('Country not supported:', userData.country);
            return; // Early return if country is not supported
        }
        
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/books?genre=${encodeURIComponent(genre)}&country=${encodeURIComponent(countryCode)}`);
            const data = await response.json();
            const sortedBooks = sortBooks(data); // Use the utility function to sort books
            setBooks(sortedBooks);
        } catch (error) {
            console.error('Failed to fetch books', error);
        }
    }, [userData.country]);


    // Fetch genres when the component mounts
    useEffect(() => {
        fetchGenres();
    }, [fetchGenres]);

    // Fetch books for 'All' when genres are set
    useEffect(() => {
        if (genres.length > 0) {
            fetchBooks('All');
        }
    }, [genres, fetchBooks]);

    const renderStarRating = (rating) => {
        let stars = [];
        for (let i = 0; i < Math.floor(rating); i++) {
            stars.push(<i key={`star-${i}`} className="fa-solid fa-star"></i>);
        }
        if (rating % 1 !== 0) {
            stars.push(<i key="half-star" className="fa-solid fa-star-half-stroke"></i>);
        }
        return <div className="star-rating">{stars}</div>; 
    };

    const getTitleMinHeight = (title) => {
        // Roughly estimate the number of lines in the title
        const lineChars = 25; // Assuming approx 25 chars fit in one line for the current font-size and container width
        const lineCount = Math.ceil(title.length / lineChars);
        return lineCount > 1 ? '3rem' : '1.5rem'; // 3rem for multiline, 1.5rem for single line
      };

    return (
        <div className="home">
            <GenreBar genres={genres} selectedGenre={selectedGenre} onSelectGenre={fetchBooks} />
            <div className="book-list">
                {books.map(book => (
                    <Link to={`/books/${book._id}/${mapCountryNameToCode(userData.country)}`} key={book._id} className="book-item" style={{ textDecoration: 'none' }}>
                        <img src={book.bookImage} alt="" />
                        <div
                            className="title"
                            style={{ minHeight: getTitleMinHeight(book.title) }} // Apply dynamic min-height based on title length
                        >
                            {book.title}
                        </div>
                        <div className="author">{book.author}</div>
                        {(book.amazonStarRating !== 'Unknown' && book.amazonReviewCount !== 'Unknown') && (
                            <div className="ratings-and-review">
                                <div className="star-rating">
                                    {renderStarRating(book.amazonStarRating)}
                                </div>
                                <span className="review-count">{book.amazonReviewCount}</span>
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};
    
export default Home;
  


