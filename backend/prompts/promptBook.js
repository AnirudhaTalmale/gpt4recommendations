require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `My query is "${userQuery}".  
    Provide the 5 most accurate book recommendations for my query mentioned above.
    If I am asking about a specific book, let's say 'Zero to One', then make sure to provide that exact book ('Zero to One') in the response.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  } else {
    prompt = `My query is "${userQuery}".  
    Provide the 5 most accurate book recommendations for my query mentioned above.
    If I am asking about a specific book, let's say 'Zero to One', then make sure to provide that exact book ('Zero to One') in the response.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  }

  return prompt;
}; 

module.exports = bookRecommendationPrompt;
