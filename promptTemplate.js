// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
    return `
    User query is "${userQuery}".  simply reply with "I don't know".
    `;
  };

  module.exports = bookRecommendationPrompt;
  