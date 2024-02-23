const bookRecommendationPrompt = (userQuery) => {
    return `${userQuery} Provide 5 books, other than the previously recommended books, strictly in following format:
 Book Title by Author enclosed within the symbol '#'
 <p>Briefly tell why the book is best for given user query</p>`;
};
  
module.exports = bookRecommendationPrompt;
