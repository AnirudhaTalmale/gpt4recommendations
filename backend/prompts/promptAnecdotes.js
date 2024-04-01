require('dotenv').config(); // Make sure to require dotenv at the start of your file

const anecdotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
 Provide Key Anecdotes strictly with following html tags:
 <b>Anecdotes</b><ol><li><b>Anecdote Name</b>: Anecdote Story</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
 Provide Key Anecdotes strictly with following html tags:
 <b>Anecdotes</b><ol><li><b>Anecdote Name</b>: Anecdote Story</li></ol>`;
  }

  return prompt;
};

module.exports = anecdotesPrompt;
