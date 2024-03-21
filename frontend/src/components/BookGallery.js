// import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom';
// import { checkAuthStatus, renderStarRating } from './CommonFunctions';

// import '../App.css'; 

// function BookGallery({ onCloseHistoryPane }) {
//   const [books, setBooks] = useState([]);
//   const [genres, setGenres] = useState([]);
//   const [selectedGenre, setSelectedGenre] = useState('All');
//   const [searchTerm, setSearchTerm] = useState('');

//   useEffect(() => {
//     checkAuthStatus(); // No need to handle the promise if userData is not used
//   }, []);

//   const handleSearch = useCallback(async (e) => {
//     e.preventDefault();
//     const searchQuery = searchTerm ? `?search=${searchTerm}` : '';
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/books${searchQuery}`);
//       if (!response.ok) throw new Error('Network response was not ok.');
//       const data = await response.json();
//       setBooks(data);
//     } catch (error) {
//       console.error("Error searching books: ", error);
//     }
//   }, [searchTerm]);

//   // Fetch genres once on mount
//   useEffect(() => {
//     fetchGenres();
//   }, []);

//   const fetchGenres = async () => {
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/genres`);
//       if (!response.ok) throw new Error('Network response was not ok.');
//       const data = await response.json();
//       setGenres(['All', ...data]);
//     } catch (error) {
//       console.error("Error fetching genres: ", error);
//     }
//   };

//   const fetchBooks = useCallback(async () => {
//     const genreQuery = selectedGenre !== 'All' ? `?genre=${selectedGenre}` : '';
//     try {
//       const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/books${genreQuery}`);
//       if (!response.ok) throw new Error('Network response was not ok.');
//       const data = await response.json();
//       setBooks(data);
//     } catch (error) {
//       console.error("Error fetching books: ", error);
//     }
//   }, [selectedGenre]);

//   // Fetch books on mount and when selectedGenre changes
//   useEffect(() => {
//     fetchBooks();
//   }, [fetchBooks]);

//   return (
//     <>
//       <form onSubmit={handleSearch} className="search-bar-container">
//         <div className="search-bar">
//             <input
//             type="text"
//             placeholder="Search by title, author, or genre"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <button type="submit">
//             <i className="fa-solid fa-magnifying-glass"></i>
//             </button>
//         </div>
//       </form>

//       <div className="genre-tabs-container">
//         {genres.map((genre, index) => (
//           <button
//             key={index}
//             onClick={() => setSelectedGenre(genre)}
//             className={`genre-tab ${selectedGenre === genre ? 'active' : ''}`}
//           >
//             {genre}
//           </button>
//         ))}
//       </div>
//       <div className="gallery-book-gallery">
//         {books.map((book, index) => (
//           <Link to={`/book-gallery/${book._id}`} key={index} className="item-book-gallery-link"> 
//             <div key={index} className="item-book-gallery">
//                 <div className="image-book-gallery">
//                     {book.bookImage && (
//                     <>
//                         <img src={book.bookImage} alt={`Cover of ${book.title}`} />
//                         <div className="title-book-gallery">{book.title}</div>
//                         <span className="author-book-gallery">by {book.author}</span>
//                         <div className="ratings-and-review-book-gallery">
//                         {book.amazonStarRating !== 'Unknown' && (
//                             <div className="star-rating-book-gallery">
//                             {renderStarRating(book.amazonStarRating)}
//                             </div>
//                         )}
//                         {book.amazonReviewCount !== 'Unknown' && (
//                             <span className="review-count-book-gallery">{book.amazonReviewCount} </span>
//                         )}
//                         </div>
//                     </>
//                     )}
//                 </div>
//             </div>
//           </Link>
//       ))}
//     </div>
//    </>
// );
// }


// export default BookGallery; 
