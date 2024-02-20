const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 1 book without numbering and strictly in following format:
 Book Title by Author enclosed within the symbol '#'`;
};

module.exports = bookRecommendationPrompt;   