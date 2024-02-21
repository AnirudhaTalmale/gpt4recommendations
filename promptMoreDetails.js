const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} strictly in given format. 
 <h3>Book Summary</h3><p>Brief</p>
 <h3>Author's Credibility</h3><p>Brief</p>
 <h3>Endorsements and Praise</h3><p>Brief</p>`
};

module.exports = moreDetailsPrompt;