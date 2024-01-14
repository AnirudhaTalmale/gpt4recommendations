// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". The query can be related to previous chats or a fresh query. Reply to it by providing 5 best books using training data in folloiwng format.
*Book Title by Author*
<b>Why this book?</b><p>Book relation with user query</p>`;
};

module.exports = bookRecommendationPrompt;