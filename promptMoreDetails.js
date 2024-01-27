const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} in given format. 
    #Book Title by Author#
Use <b> for title and <p> for details - Book summary, Author's Credibility, Key Insights, Case studies and Anecdotes, Endorsements and Praise`
};

module.exports = moreDetailsPrompt;