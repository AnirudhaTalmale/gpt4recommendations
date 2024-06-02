require('dotenv').config(); // Make sure to require dotenv at the start of your file

const keyInsightsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
  Provide large number of Key Insights present in the above book. The final answer should be strictly strictly with following html tags:
 <b>Insights</b><ol><li><b>Insight name</b>: Insight Description</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
  Provide large number of Key Insights present in the above book. The final answer should be strictly strictly with following html tags:
 <b>Insights</b><ol><li><b>Insight name</b>: Insight Description</li></ol>`;
  }

  return prompt;
};

module.exports = keyInsightsPrompt;
