// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If the query is anything other than book recommendation then immediately reply - Please ask questions about books. 
  Else recommend one book as per given user query based on your training data in following format: 
  <h3>Title of the Book</h3>

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

  <b>Similar Books</b>
  <ol>
    <li>List books that are similar in genre, theme, or style, providing a brief comparison for each.</li>
  </ol>

  <b>Endorsements and Influential Praise</b>
  <p>Include notable endorsements or praise the book has received from influential figures or institutions.</p>

  <b>Critical Acclaim and Reception</b>
  <p>Discuss how the book was received by critics and the general public, including both positive and negative critiques.</p>

  <b>Social and Cultural Impact</b>
  <p>Analyze the book's impact on society and culture, including how it might have influenced public opinion, policy, or other books and media.</p>

  <br>
`;
};

module.exports = bookRecommendationPrompt;