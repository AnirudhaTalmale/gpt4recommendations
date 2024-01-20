const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". Understand whether the query is related to previous chats or is it a fresh query. Provide 5 books and the reply should be restricted to following format.
#Book Title by Author#
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;