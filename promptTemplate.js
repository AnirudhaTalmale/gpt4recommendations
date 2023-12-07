// promptTemplate.js
const bookRecommendationPrompt = (userQuery) => {
    return `
    User query is "${userQuery}".  If the user query is related to seeking further information about the books described in the previous chats then answer immediately. Else if the query is not related to previous chats and also not about book recommendations then immediately send this quoted answer “Please ask questions about books”. Else if both the previous conditions are false and if the query is about book recommendations, then please recommend two books as per given user query based on your training data and make sure to address following 9 points in detail for each of the books: 

    1. Detailed Analysis and Review of the Book: You have just finished reading a book that offers a groundbreaking perspective in its field. Write a detailed analysis explaining why someone should buy this book. Focus on its unique approach and key insights. Highlight how this book differs from others in its genre. Discuss its novel concepts, theories, or methodologies, emphasizing their significance and practical applications. Explain how it challenges conventional wisdom and introduces new ideas. Mention its readability and engagement value for its intended audience. Also, note any unique structural or stylistic elements that enhance the reader's experience. Convince the reader why this book is a standout choice in its genre or field.
    
    2. Author's Background, Expertise, and Influence: Provide an in-depth analysis of the author’s professional background, highlighting their journey, major influences, and significant experiences that have shaped their expertise. Discuss their previous works, academic or professional credentials, and any unique experiences that lend credibility to the book's content. Examine how the author's perspective, based on their background, adds depth and uniqueness to the book's subject. Explore the reception of the author's work in their field, including feedback from peers, critics, and academic circles. Analyze how the author's unique approach, informed by their background and experiences, contributes to new insights in their genre or field, and discuss how they are regarded by other experts in the same area.
    
    3. Key Insights from the Book: This section offers a descriptive overview of significant and representative content found within each book. These descriptions are designed to capture the essence of the book, providing insights into its unique style, tone, and thematic depth. While not direct excerpts, these overviews will include synopses of key narratives, pivotal moments, or illustrative scenarios that are central to each book's message. The aim is to give potential readers a vivid sense of the book's narrative richness and the author's narrative skill. By highlighting the book's most captivating, innovative, or thought-provoking elements, this section serves to engage the reader and provide a meaningful glimpse into the book's unique qualities, setting the stage for the full reading experience.
    
    4. Interesting Examples in the book: Provide several detailed examples or anecdotes from the book that vividly illustrate its main concepts or themes. These should be specific, impactful passages, scenarios, or narrative elements that encapsulate the essence of the book. Describe how each example or anecdote uniquely represents the book's core ideas, theories, or methodologies. Explain their relevance and significance within the book's broader context, illustrating how they contribute to the book's groundbreaking perspective. Additionally, discuss how these specific examples engage the reader, reflect the author's style, and enhance the overall narrative or argument presented in the book.
    
    5. Achievements of the Book: Discuss its bestseller status, including what constitutes a bestseller, the book's sales achievements, and how this status demonstrates wide readership and commercial success.  Describe the awards, honors, and recognitions it has received, emphasizing their significance in the literary world and how they underscore the book's quality, popularity, and influence. Explain the criteria and prestige of each award, and how they reflect the book's appeal and relevance.
    
    6. Similar Books Recommendations: Explain the reason why are they similar reads and how can they help user.
    
    7. Endorsements and Influential Praise: Elaborate on any notable endorsements the book has received, focusing on the diversity and prominence of the endorsers. This could include detailed praise from renowned figures in the book's genre, laudatory comments from top literary critics, or recommendations from celebrities or influential public figures. Discuss the specific aspects of the book each endorser highlights, such as its innovative ideas, compelling writing style, or the impact it had on them personally. Also, include any endorsements from academic or professional experts relevant to the book’s subject matter, highlighting how their authority and expertise lend weight to their commendation. Explain how these endorsements contribute to the book's credibility and appeal, potentially influencing readers' perceptions and decisions. Additionally, delve into any endorsements from organizations or institutions, such as literary societies, educational institutions, or professional groups, specifying how their backing underscores the book’s relevance and significance in its field.
    
    8. Critical Acclaim and Reception: Provide a comprehensive analysis of the book's critical acclaim and reception in the literary world. Detail the book's reception by critics and the general audience, citing specific examples from prominent literary reviews, publications, or notable critics. Discuss both the praise and criticism the book has received, explaining the reasons behind differing opinions. Highlight any awards or recognitions the book has earned, delving into their importance and relevance to the book's quality and impact. Examine the book's standing and reputation within its specific genre or literary circles, including discussions on forums, literary clubs, or academic circles. Explore how the book's themes, style, or content have been received and debated. Include insights into how the book compares with other works in the same genre or by the same author. Additionally, analyze the book's broader cultural impact, such as its influence on other authors, its contribution to literary trends, or its reflection of societal issues or movements. Summarize the overall sentiment towards the book, providing a balanced view of its acclaim and reception in the literary community.
    
    9. Social and Cultural Impact: Delve into the book's influence on its readers and its role in popular culture. This includes exploring how the book is utilized or discussed in educational or professional contexts, its representation in media (such as adaptations into movies, TV shows, or plays), and its presence in book clubs or online communities. Examine any significant social media trends, hashtags, or reader testimonials that illustrate the book's popularity and reach. Describe the book's ability to spark conversations, influence thought, or be referenced in various cultural settings. Additionally, consider the book's impact on specific demographic groups or communities, if applicable, and how it resonates with or challenges societal norms or perspectives.
    
    Do not provide any info other than the JSON having following format, with each book's information as a separate object within the array, even if there is only one book:
    [
        {
            "detailedAnalysisAndReview": "string",
            "authorsBackground": "string",
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
  