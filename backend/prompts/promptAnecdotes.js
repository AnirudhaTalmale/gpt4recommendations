require('dotenv').config(); // Make sure to require dotenv at the start of your file

const anecdotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide up to 5 of the most important anecdotes from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Anecdotes</b>
    <ol><li><b>Anecdote Name</b>: Explain the Anecdote in detail</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide up to 5 of the most important anecdotes from the book mentioned above.
    The response should be strictly in the following format, without any introduction:
    <b>Anecdotes</b>
    <ol><li><b>Anecdote Name</b>: Explain the Anecdote in detail</li></ol>`;
  }

  return prompt;
};

module.exports = anecdotesPrompt;
