// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
  return `User query is "${userQuery}". If the query is anything other than book recommendation then immediately reply - Please ask questions about books. 
  Else recommend one book as per given user query based on your training data. The final answer should not contain anything other than following nine points for each recommended book. Use HTML tags b, ol, li, p, br for formatting.
  Detailed Analysis and Review, Background of Author, Key Insights from Book, Interesting Examples in Book, Achievements of Book, Similar Books Recommendations, Endorsements and Influential Praise, Critical Acclaim and Reception, Social and Cultural Impact.`;
};

module.exports = bookRecommendationPrompt;