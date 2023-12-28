// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If the user query is related to books in previous chats then immediately reply using appropriate html tags. Else if the user is not asking about books then immediately reply - Please ask question about books or previous book related chats. 
  Else in following format, provide two books for given user query based on your training data and previous chats: 
  <h3>"Book title by author name" enclosed within asterisk</h3>

  <p>Explain in single sentence the relation of this book with the user query - "${userQuery}"</p>

  <b>Detailed Analysis and Review</b>
  <p>Provide a comprehensive analysis of the book</p>

  <b>Background of Author</b>
  <p>Background which shaped writing of this book</p>

  <b>Key Insights from Book</b>
  <ul>
    <li>Explain the major insights or lessons that can be drawn from the book</li>
  </ul>

  <b>Interesting Examples in Book</b>
  <p>Notable examples, case studies, or anecdotes used in the book</p>

  <b>Achievements of the Book</b>
  <p>Awards, recognitions or significant milestones achieved by the book</p>

  <b>Endorsements and Influential Praise</b>
  <p>Include notable endorsements or praise the book has received from influential figures or institutions</p>

  <b>Similar Books</b>
  <ol>
    <li><b>List 2 more similar book names enclosed within asterisk</b> <p>Explain similarity for each of them</p></li>
  </ol>

  <a href="https://www.amazon.in/s?k=BookTitleByAuthorName" target="_blank"><button>Buy now on Amazon</button></a>
`;
};

module.exports = bookRecommendationPrompt;