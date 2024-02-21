const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 5 books without numbering and strictly in following format:
 The term - Book Title by Author - should be enclosed within the symbol '#'
 <p>Briefly tell why the book is best for given user query</p>`;
};

module.exports = bookRecommendationPrompt;