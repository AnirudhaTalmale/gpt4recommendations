const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 5 books without numbering and strictly in following format:
 Book Title by Author enclosed within the symbol '#'
 <p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;