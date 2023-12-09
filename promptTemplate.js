// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
    return `
    User query is "${userQuery}".  If the user query is related to seeking further information about the books described in the previous chats then answer immediately. Else if the query is not related to previous chats and also not about book recommendations then immediately reply - Please ask questions about books. Else if both the previous conditions are false and if the query is about book recommendations, then please recommend one book as per given user query based on your training data and make sure to address following 9 points in detail for each of the books.
    
    Do not provide any info other than the JSON having following format, with each book's information as a separate object within the array, even if there is only one book:
    [
        {
            "detailedAnalysisAndReview": "string",
            "backgroundOfAuthor": "string",
            "keyInsightsFromBook": "string",
            "interestingExamplesInBook": "string",
            "achievementsOfBook": "string",
            "similarBooksRecommendations": "string",
            "endorsementsAndInfluentialPraise": "string",
            "criticalAcclaimAndReception": "string",
            "socialAndCulturalImpact": "string"
        },
        // more books if any...
    ]
    `;
  };

  module.exports = bookRecommendationPrompt;
  