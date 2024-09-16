require('dotenv').config(); // Make sure to require dotenv at the start of your file

const keyInsightsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide a large number of Key Insights from the above book without including any introduction, strictly in the following format:
    <b>Insights</b>
    <ol>
      <li>
        <b>
          Insight name
        </b>
        : Explain the insight.
      </li>
    </ol>
    `;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide a large number of Key Insights from the above book without including any introduction, strictly in the following format:
    <b>Insights</b>
    <ol>
      <li>
        <b>
          Insight name
        </b>
        : Explain the insight.
      </li>
    </ol>
    `;
  } 
    return prompt;
};

module.exports = keyInsightsPrompt;
