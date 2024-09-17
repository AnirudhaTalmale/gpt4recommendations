require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `User query is "${userQuery}".  
    Provide the 5 most accurate book recommendations for the user query mentioned above.
    If the user is asking about a specific book, then provide that exact book in the response.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  } else {
    prompt = `User query is "${userQuery}".  
    Provide the 5 most accurate book recommendations for the user query mentioned above.
    If the user is asking about a specific book, then provide that exact book in the response.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  }

  return prompt;
}; 

module.exports = bookRecommendationPrompt;
