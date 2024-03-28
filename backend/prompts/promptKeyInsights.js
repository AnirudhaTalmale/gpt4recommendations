const keyInsightsPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Insights strictly with following html tags:
 <b>Insights</b><ol><li><b>Key point</b>: Details</li></ol>`
};

module.exports = keyInsightsPrompt;
