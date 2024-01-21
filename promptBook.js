const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". Provide 5 books in following format.
#Book Title by Author#
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;