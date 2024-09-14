require('dotenv').config(); // Make sure to require dotenv at the start of your file

const moreDetailsPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `${userQuery} - strictly in the following format:
    <b>Book Summary</b>
    <p>Provide a brief summary of the book.</p>

    <b>Author's Credibility</b>
    <p>Discuss the author's background and credibility.</p>

    <b>Endorsements and Praise</b>
    <p>If you don't know about this then let me know or else provide the required details</p>

 `;
  } else {
    prompt = `${userQuery} - strictly in the following format:
    <b>Book Summary</b>
    <p>Provide a brief summary of the book.</p>

    <b>Author's Credibility</b>
    <p>Discuss the author's background and credibility.</p>

    <b>Endorsements and Praise</b>
    <p>If you don't know about this then let me know or else provide the required details</p>

 `;
  }

  return prompt;
};

module.exports = moreDetailsPrompt;
