require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}". Reply in English. Provide 2 books for the given user query, without numbering and strictly in the following format:
    Book Title by Author - should be enclosed within the symbol '#' `;
  } else {
    prompt = `User query is "${userQuery}". Reply in English. Provide 5 books for the given user query, without numbering and strictly in the following format:
    Book Title by Author - should be enclosed within the symbol '#'
    <p>Provide the reason for recommending this book for given user query</p> `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;
