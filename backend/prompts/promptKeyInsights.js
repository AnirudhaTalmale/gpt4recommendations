const keyInsightsPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Insights strictly with following html tags:
 <b>Insights</b><ol><li><b>Insight name</b>: Insight Description</li></ol>`
};

module.exports = keyInsightsPrompt;
