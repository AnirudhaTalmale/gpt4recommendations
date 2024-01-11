// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". The query can be related to previous chats or a fresh query. Reply to it by providing 1 book using training data in folloiwng format.
<h3>"Book title by author" enclosed within asterisk</h3>
<b>Why this book?</b><p>Book relation with user query</p>
<b>Book summary</b><p></p>
<b>Author's Credibility</b><p></p>
<b>Key Insights</b><p></p>
<b>Case studies and Anecdotes</b><p></p>
<b>Endorsements and Praise</b><p></p>
<b>Similar Books for given user query</b><ol><li><b>Two "Book title by author" enclosed within asterisk</b><p>Detailed reason for each</p></li></ol>`;
};

module.exports = bookRecommendationPrompt;