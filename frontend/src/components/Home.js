import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { mapCountryNameToCode, renderStarRating } from './CommonFunctions';
import axios from 'axios';

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

const Home = ({ userData }) => {
    const [genres, setGenres] = useState([]);
    const [books, setBooks] = useState([]);
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [loading, setLoading] = useState(false); 

    const fetchGenres = useCallback(async () => {
        const countryCode = mapCountryNameToCode(userData.country);
        if (!countryCode) {
            console.error('Country not supported:', userData.country);
            return; // Early return if country is not supported
        }
        
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/distinct-genres`, {
                userId: userData.id, 
                country: countryCode
            });
            const data = response.data;
            setGenres(['All', ...data.genres]); // Prepend 'All' to the list of genres
        } catch (error) {
            console.error('Failed to fetch genres', error);
        }
    }, [userData.id, userData.country]);

    const fetchBooks = useCallback(async (genre = 'All') => {
        setLoading(true); // Start loading
        setSelectedGenre(genre); // Update the selected genre
        const countryCode = mapCountryNameToCode(userData.country);
        if (!countryCode) {
            console.error('Country not supported:', userData.country);
            return; // Early return if country is not supported
        }
        
        try {
            console.log(genre, countryCode);
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/books`, {
                genre: genre,
                countryCode: countryCode,
                userId: userData.id  // Passing userId in the body
            });
            setBooks(response.data);
        } catch (error) {
            console.error('Failed to fetch books', error);
        }
        setLoading(false); // End loading
    }, [userData.id, userData.country]); 

    useEffect(() => {
        fetchGenres();
        fetchBooks(); // Fetch all books when component mounts
    }, [fetchGenres, fetchBooks]);

    useEffect(() => {
        const homeElement = document.querySelector('.home');
        if (homeElement) {
            homeElement.scrollTop = 0;
        }
    }, [books]);
    

    const getTitleMinHeight = (title) => {
        // Roughly estimate the number of lines in the title
        const lineChars = 25; // Assuming approx 25 chars fit in one line for the current font-size and container width
        const lineCount = Math.ceil(title.length / lineChars);
        return lineCount > 1 ? '3rem' : '1.5rem'; // 3rem for multiline, 1.5rem for single line
      };

    return (
        <div className="home">
            <GenreBar genres={genres} selectedGenre={selectedGenre} onSelectGenre={fetchBooks} />
            {loading && (
                <div className="loading-overlay">
                </div>
            )}
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
  


