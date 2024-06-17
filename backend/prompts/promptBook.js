require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}". Reply in English. Provide 5 books for the given user query, without numbering and strictly in the following format:
    Book Title by Author - should be enclosed within the symbol '#'
    <p>Briefly explain the reason for recommending this book</p> `;
  } else {
    prompt = `User query is "${userQuery}". Reply in English. Provide 5 books for the given user query, without numbering and strictly in the following format:
    Book Title by Author - should be enclosed within the symbol '#'
    <p>Briefly explain the reason for recommending this book</p> `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;
