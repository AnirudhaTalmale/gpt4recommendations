require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `My query is "${userQuery}". For my query, provide top 1 book without numbering and strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly tell, why the book is best for my query</p> `;
  } else {
    prompt = `My query is "${userQuery}". For my query, provide top 5 books without numbering and strictly in following format:
    Book Title by Author - should be enclosed within the symbol '#' 
    <p>Briefly tell, why the book is best for my query</p> `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;