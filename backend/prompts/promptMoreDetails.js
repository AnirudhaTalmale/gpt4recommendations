const moreDetailsPrompt = (userQuery) => {
    return `${userQuery} strictly with following html tags:
 <b>Book Summary</b><p>Brief</p>
 <b>Author's Credibility</b><p>Brief</p>
 <b>Endorsements and Praise</b><p>Brief</p>`
};

module.exports = moreDetailsPrompt;