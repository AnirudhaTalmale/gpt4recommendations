const anecdotesPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide Key Anecdotes strictly with following html tags:
 <b>Anecdotes</b><ol><li><b>Anecdote Name</b>: Anecdote Story</li></ol>`
};

module.exports = anecdotesPrompt;