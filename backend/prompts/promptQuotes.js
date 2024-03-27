const quotesPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Quotes strictly with following html tags:
 <b>Quotes</b><ol><li>"Quote"</li></ol>`
};

module.exports = quotesPrompt;
