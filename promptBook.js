const bookRecommendationPrompt = (userQuery) => {
  return `${userQuery}. Provide 1 book without numbering and in following format:
  Book Title by Author - should be enclosed within the symbol '#' `;
};

module.exports = bookRecommendationPrompt;