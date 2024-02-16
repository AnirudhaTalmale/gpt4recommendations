const anecdotesPrompt = (userQuery) => {
    return `Book name is "${userQuery}"
 Provide interesting anecdotes present in the book in following format:
 <h3>Interesting Anecdotes</h3><ol><li><strong>Anecdote name:</strong>Details</li></ol>`
};

module.exports = anecdotesPrompt;
