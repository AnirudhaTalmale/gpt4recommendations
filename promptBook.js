const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". Understand whether the query is related to previous chats or is it a fresh query. Reply to it by providing 5 books in folloiwng format.
*Book Title by Author*
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;