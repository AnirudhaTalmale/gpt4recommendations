require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}". Reply in English without including any introduction. If the user query specifically mentions a book, prioritize that exact book in the response. Suggest 5 books relevant to the query, strictly in the following format:

    #Book Title by Author#
    <p> how the book is related to given user query </p>  
    
    `;
  } else {
    prompt = `User query is "${userQuery}". Reply in English without including any introduction. If the user query specifically mentions a book, prioritize that exact book in the response. Suggest 5 books relevant to the query, strictly in the following format:

    #Book Title by Author#
    <p> how the book is related to given user query </p>  
    
    `;
  }

  return prompt;
}; 

module.exports = bookRecommendationPrompt;
