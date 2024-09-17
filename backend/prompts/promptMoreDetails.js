require('dotenv').config(); // Make sure to require dotenv at the start of your file

const moreDetailsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} - strictly in the following format:
    <b>Book Summary</b><p>Detailed</p>
    <b>Author's Credibility</b><p>Details</p>
    <b>Book Endorsements and Praise</b><p>Details</p>`;
  } else {
    prompt = `${userQuery} - strictly in the following format:
    <b>Book Summary</b><p>Detailed</p>
    <b>Author's Credibility</b><p>Details</p>
    <b>Book Endorsements and Praise</b><p>Details</p>`;
  }

  return prompt;
};

module.exports = moreDetailsPrompt;
