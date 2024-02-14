const keyInsightsPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Insights in following format. 
 <h3>Key Insights</h3><ol><li><strong>Key point:</strong>Details</li></ol>`
};

module.exports = keyInsightsPrompt;
