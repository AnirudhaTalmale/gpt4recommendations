const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} in given format. 
    #Book Title by Author#
<b>Book summary</b><p>Details</p>
<b>Author's Credibility</b><p>Details</p>
<b>Key Insights</b><p>Details</p>
<b>Case studies and Anecdotes</b><p>Details</p>
<b>Endorsements and Praise</b><p>Details</p>`
};

module.exports = moreDetailsPrompt;