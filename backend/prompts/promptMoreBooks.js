require('dotenv').config(); // Make sure to require dotenv at the start of your file

const bookRecommendationPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} Provide 5 more books other than the previously recommended books, strictly in following format:
    
    #Book Title by Author#
    <p> One line reason for recommending this book </p>  
    
    `;
  } else {
    prompt = `${userQuery} Provide 5 more books other than the previously recommended books, strictly in following format:
    
    #Book Title by Author#
    <p> One line reason for recommending this book </p>  
    
    `;
  }

  return prompt;
};

module.exports = bookRecommendationPrompt;
