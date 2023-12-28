// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If the user query is related to previous chats then provide straight forward reply using appropriate html tags. Else if the user query is not about books then reply - Please ask question about books or previous book related chats. Else if the user query is not related to previous chats then provide two books, each in following format, for given user query based on your training data and previous chats: 
<h3>Book name enclosed within asterisk</h3>
<p>Relation of this book with user query</p>
<b>Book summary</b><p></p>
<b>Author's Background</b><p></p>
<b>Key Insights</b><ul><li>Overview</li></ul>
<b>Notable case studies and anecdotes</b><p></p>
<b>Notable endorsements and praise</b><p>/p>
<b>Similar Books</b><ol><li><b>List 2 book names enclosed within asterisk</b><p>Reason</p></li></ol>
<a href="https://www.amazon.in/s?k=BookTitleByAuthorName" target="_blank"><button>Buy now on Amazon</button></a>`;
};

module.exports = bookRecommendationPrompt;