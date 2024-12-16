require('dotenv').config(); // Make sure to require dotenv at the start of your file

const keyInsightsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide up to 5 of the most important Insights from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Insights</b>
    <ol><li><b>Insight Name</b>: Explain the Insight in detail</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide up to 5 of the most important Insights from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Insights</b>
    <ol><li><b>Insight Name</b>: Explain the Insight in detail</li></ol>`;
  }
    return prompt;
};

module.exports = keyInsightsPrompt;
