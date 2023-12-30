// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If query not about book recommendations then reply - Please ask question about books. Else give 1 book as per user query exactly in following format based on training data. If user query contains reference to previous chats, then refer them.
<h3>Book name within asterisk</h3>
<b>Why this book?</b><p>Book relation with user query</p>
<b>Book summary</b><p>Detailed</p>
<b>Author's Credibility</b><p>Detailed</p>
<b>Key Insights</b><p>Detailed</p>
<b>Case studies and Anecdotes</b><p>Detailed</p>
<b>Endorsements and Praise</b><p>/p>
<b>Similar Books</b><ol><li><b>Two book names within asterisk</b><p>Detailed reason for each</p></li></ol>
<a href="https://www.amazon.in/s?k=BookNameByAuthor" target="_blank"><button>Buy now on Amazon</button></a>`;
};

module.exports = bookRecommendationPrompt;