const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 3 books without numbering and in following format:
  Book Title by Author - should be enclosed within the symbol '#' 
  <p>Briefly tell why the book is best for given user query</p>`;
};

module.exports = bookRecommendationPrompt;