const quotesPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Quotes strictly in following format:
 <h3>Key Quotes</h3><ol><li>"Quote"</li></ol>`
};

module.exports = quotesPrompt;
