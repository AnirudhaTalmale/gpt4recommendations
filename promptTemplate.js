// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If query not about book recommendations then reply - Please ask question about books. Else give 1 book as per user query exactly in following format based on training data. If user query contains reference to previous chats, then refer them.
<h3>Title with author within asterisk</h3>
<b>Why this book?</b><p>Book relation with user query</p>
<b>Similar Books</b><ol><li><b>Two titles with authors within asterisk</b><p>Detailed reason for each</p></li></ol>`
};

module.exports = bookRecommendationPrompt;