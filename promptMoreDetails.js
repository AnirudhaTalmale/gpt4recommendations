const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} in given format. 
 <h3>Book Summary</h3><p>Details</p>
 <h3>Author's Credibility</h3><p>Details</p>
 <h3>Endorsements and Praise</h3><p>Details</p>`
};

module.exports = moreDetailsPrompt;