const newsletterPrompt = (userQuery) => {
    return `Divide following user queries in categories. A single category can correspond to multiple queries. Provide two books using training data for each category in given format.
${userQuery}

<h3>Category name</h3>
*Book Title by Author*
<p>Book relation with category</p>`;
};

module.exports = newsletterPrompt;