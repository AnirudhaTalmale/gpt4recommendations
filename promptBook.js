const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". The query can be related to previous chats or a fresh query. Reply to it by providing 5 books in folloiwng format.
*Book Title by Author*
<p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;