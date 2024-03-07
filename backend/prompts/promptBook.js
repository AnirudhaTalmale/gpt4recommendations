require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  const bookQuantity = process.env.BOOK_QUANTITY;
  return `${userQuery}. Provide ${bookQuantity} without numbering and strictly in following format:
  Book Title by Author - should be enclosed within the symbol '#' 
  <p>Briefly tell why the book is best for given user query</p>`;
};

module.exports = bookRecommendationPrompt;