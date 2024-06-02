require('dotenv').config(); // Make sure to require dotenv at the start of your file

const anecdotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide large number of Key Anecdotes present in the above book, strictly with following html tags:
 <b>Anecdotes</b><ol><li><b>Place anecdote name here</b>: provide anecdote story here</li></ol>`;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide large number of Key Anecdotes present in the above book, strictly with following html tags:
 <b>Anecdotes</b><ol><li><b>Place anecdote name here</b>: provide anecdote story here</li></ol>`;
  }

  return prompt;
};

module.exports = anecdotesPrompt;
