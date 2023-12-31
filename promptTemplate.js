// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If query not about book recommendations then reply - Please ask question about books. Else give 1 book as per user query exactly in following format based on training data. If user query contains reference to previous chats, then refer them.
<h3>Book name within asterisk</h3>
<a href="https://www.amazon.in/s?k=BookNameByAuthor" target="_blank"><button>Buy now on Amazon</button></a>`;
};

module.exports = bookRecommendationPrompt;