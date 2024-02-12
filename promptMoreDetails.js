const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} in given format. 
    #Book Title by Author#
<h3>Book Summary</h3><p>Details</p>
<h3>Author's Credibility</h3><p>Details</p>
<h3>Key Insights</h3><ol><li><strong>Key point:</strong>Details</li></ol>
<h3>Case Studies and Anecdotes</h3><p>Details</p>
<h3>Endorsements and Praise</h3><p>Details</p>`
};

module.exports = moreDetailsPrompt;