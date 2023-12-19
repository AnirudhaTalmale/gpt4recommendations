// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If the query is related to books recommended in previous chats then immediately reply to it using appropriate html tags. Else if the query is anything other than book recommendation then immediately reply - Please ask question about book recommendation or previously recommended book. 
  Else in following format, recommend one book as per given user query based on your training data and previous chats: 
  <h3>"Book title by author name" enclosed within asterisk</h3>

  <b>Detailed Analysis and Review</b>
  <p>Provide a comprehensive analysis of the book, covering its themes, narrative style, character development, and overall storytelling.</p>

  <b>Background of Author</b>
  <p>Discuss the author's background, previous works, and how their experiences and perspectives have shaped the writing of this book.</p>

  <b>Key Insights from Book</b>
  <ul>
    <li>Highlight the major insights or lessons that can be drawn from the book.</li>
    <li>Discuss how these insights are relevant or impactful for the reader.</li>
  </ul>

  <b>Interesting Examples in Book</b>
  <p>Identify and elaborate on any notable examples, case studies, or anecdotes used in the book that significantly enhance the reader's understanding of the content.</p>

  <b>Achievements of Book</b>
  <p>Detail any awards, recognitions, or significant milestones achieved by the book since its publication.</p>

  <b>Endorsements and Influential Praise</b>
  <p>Include notable endorsements or praise the book has received from influential figures or institutions.</p>

  <b>Critical Acclaim and Reception</b>
  <p>Discuss how the book was received by critics and the general public, including both positive and negative critiques.</p>

  <b>Social and Cultural Impact</b>
  <p>Analyze the book's impact on society and culture, including how it might have influenced public opinion, policy, or other books and media.</p>

  <b>Similar Books</b>
  <ol>
    <li><b>List 4 books that are similar in genre, theme, or style. Make sure to enclose "book title by author name" within asterisk.</b> <p>Explain the reason of similarity for each of them.</p></li>
  </ol>

  <a href="https://www.amazon.in/s?k=BookTitleByAuthorName" target="_blank"><button>Buy now on Amazon</button></a>
  </br>
`;
};

module.exports = bookRecommendationPrompt;