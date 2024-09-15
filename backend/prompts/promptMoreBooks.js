require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} 
    Observe the above previously recommended books and above given user's query. 
    Now Suggest 10 books other than the previously recommended books and strictly adhering to the user's query.
    The response should not contain any introduction or numbering.
    The response should be strictly in following format: 
    #Book Title by Author#
    <p>
      Explain how the book is perfect for the given user query
    </p>
    `;
  } else {
    prompt = `${userQuery} 
    Observe the above previously recommended books and above given user's query. 
    Now Suggest 10 books other than the previously recommended books and strictly adhering to the user's query.
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
