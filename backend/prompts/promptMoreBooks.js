require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} Provide 5 books without numbering and other than the previously recommended books, strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly explain the reason for recommending this book</p> `;
  } else {
    prompt = `${userQuery} Provide 5 books without numbering and other than the previously recommended books, strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly explain the reason for recommending this book</p> `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;
