const bookRecommendationPrompt = (userQuery) => {
    return `${userQuery} Provide 5 more books, other than the previously recommended books, strictly in following format:
 Book Title by Author enclosed within the symbol '#'
 <p>Book relation with user query</p>`;
};
  
module.exports = bookRecommendationPrompt;
