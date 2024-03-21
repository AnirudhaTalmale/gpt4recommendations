require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  const bookQuantity = process.env.BOOK_QUANTITY;
  return `User query is "${userQuery}". For the given user query, provide ${bookQuantity} without numbering and strictly in following format:
  Book Title by Author - should be enclosed within the symbol '#'`;
};

module.exports = bookRecommendationPrompt;