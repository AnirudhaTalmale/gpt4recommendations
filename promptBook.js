const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 2 books in given format:
#Book Title by Author#
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;