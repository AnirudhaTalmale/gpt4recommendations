require('dotenv').config(); // Make sure to require dotenv at the start of your file

const quotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide up to 10 of the most important Quotes from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Quotes</b>
    <ol><li><b>"Quote"</b>: Explain the Quote in detail</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide up to 10 of the most important Quotes from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Quotes</b>
    <ol><li><b>"Quote"</b>: Explain the Quote in detail</li></ol>`;
  }

  return prompt;
};

module.exports = quotesPrompt;
