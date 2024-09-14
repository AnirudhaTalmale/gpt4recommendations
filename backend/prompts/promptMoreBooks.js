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



// require('dotenv').config(); // Make sure to require dotenv at the start of your file

// const bookRecommendationPrompt = (userQuery) => {
//   let prompt;

//   if (process.env.NODE_ENV === 'local') {
//     prompt = `User query is "${userQuery}". Reply in English without including any introduction. If the user query specifically mentions a book, prioritize that exact book in the response. Suggest 5 books relevant to the query, strictly in the following format:

//     #Book Title by Author#
//     <p>Provide the reason for recommending this book for given user query</p> `;
//   } else {
//     prompt = `User query is "${userQuery}". Reply in English without including any introduction. If the user query specifically mentions a book, prioritize that exact book in the response. Suggest 5 books relevant to the query, strictly in the following format:

//     #Book Title by Author#
//     <p>Provide the reason for recommending this book for given user query</p> `;
//   }

//   return prompt;
// }; 

// module.exports = bookRecommendationPrompt;
