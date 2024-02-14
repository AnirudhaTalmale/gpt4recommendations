const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 1 book in given format:
  #Book Title by Author#
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;