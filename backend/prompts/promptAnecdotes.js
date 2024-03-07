const anecdotesPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Anecdotes strictly in following format:
 <h3>Key Anecdotes</h3><ol><li><strong>Anecdote Name: </strong>Anecdote Story</li></ol>`
};

module.exports = anecdotesPrompt;
