const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 1 book without numbering and strictly in following format:
 The term - Book Title by Author - should be enclosed within the symbol '#'`;
};

module.exports = bookRecommendationPrompt;