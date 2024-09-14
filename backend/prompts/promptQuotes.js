require('dotenv').config(); // Make sure to require dotenv at the start of your file

const quotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide a large number of important Quotes from the above book without including any introduction, strictly in the following format:
    <b>Quotes</b>
    <ol>
      <li>
        "Quote"
      </li>
    </ol>
    `;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide a large number of important Quotes from the above book without including any introduction, strictly in the following format:
    <b>Quotes</b>
    <ol>
      <li>
        "Quote"
      </li>
    </ol>
    `;
  }

  return prompt;
};

module.exports = quotesPrompt;
