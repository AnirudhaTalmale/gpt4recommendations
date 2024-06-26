require('dotenv').config(); // Make sure to require dotenv at the start of your file

const moreDetailsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} strictly with following html tags:
 <b>Book Summary</b><p>Brief</p>
 <b>Author's Credibility</b><p>Brief</p>
 <b>Endorsements and Praise</b><p>Brief</p>`;
  } else {
    prompt = `${userQuery} strictly with following html tags:
 <b>Book Summary</b><p>Brief</p>
 <b>Author's Credibility</b><p>Brief</p>
 <b>Endorsements and Praise</b><p>Brief</p>`;
  }

  return prompt;
};

module.exports = moreDetailsPrompt;
