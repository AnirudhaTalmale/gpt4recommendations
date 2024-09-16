require('dotenv').config(); // Make sure to require dotenv at the start of your file

const anecdotesPrompt = (userQuery) => {
  let prompt;

  if (process.env.NODE_ENV === 'local') {
    prompt = `Book name is "${userQuery}"
    Provide a large number of Key Anecdotes from the above book without including any introduction, strictly in the following format:
    <b>Anecdotes</b>
    <ol>
      <li>
        <b>
          Anecdote Name
        </b> 
        : Explain the anecdote
      </li>
    </ol>
    `;
  } else {
    prompt = `Book name is "${userQuery}"
    Provide a large number of Key Anecdotes from the above book without including any introduction, strictly in the following format:
    <b>Anecdotes</b>
    <ol>
      <li>
        <b>
          Anecdote Name
        </b> 
        : Explain the anecdote
      </li>
    </ol>
    `;
  }

  return prompt;
};

module.exports = anecdotesPrompt;
