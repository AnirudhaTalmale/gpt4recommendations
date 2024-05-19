require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}". For the given user query, provide 5 books without numbering and strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly tell, why the book is best for given user query</p> `;
  } else {
    prompt = `User query is "${userQuery}". For the given user query, provide 5 books without numbering and strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly tell, why the book is best for given user query</p> `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;