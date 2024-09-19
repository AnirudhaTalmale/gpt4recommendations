require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} 
    Provide the 5 most accurate book recommendations (other than the previously recommended books) for my query mentioned above.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  } else {
    prompt = `${userQuery} 
    Provide the 5 most accurate book recommendations (other than the previously recommended books) for my query mentioned above.
    The response should be strictly in the following format, without any introduction and numbering:
    Book Title by Author enclosed within # symbol. For example - #Rich Dad Poor Dad by Robert Kiyosaki#
    <p>Reason for recommending the book</p>`;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;
