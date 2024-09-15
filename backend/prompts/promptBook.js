require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}".  
    Suggest 10 books strictly adhering to the above user's query.
    If the user query specifically mentions a book, prioritize that exact book in the response. 
    The response should not contain any introduction or numbering.
    The response should be strictly in following format: 
    #Book Title by Author#
    <p>
      Explain how the book is perfect for the given user query
    </p>
    `;
  } else {
    prompt = `User query is "${userQuery}".  
    Suggest 10 books strictly adhering to the above user's query.
    If the user query specifically mentions a book, prioritize that exact book in the response. 
    The response should not contain any introduction or numbering.
    The response should be strictly in following format: 
    #Book Title by Author#
    <p>
      Explain how the book is perfect for the given user query
    </p>
    `;
  }

  return prompt;
}; 

module.exports = bookRecommendationPrompt;
