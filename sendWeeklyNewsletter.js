const User = require('./models/User');
const Session = require('./models/Session');
const newsletterPrompt = require('./promptNewsLetter');
const openaiApi = require('./openaiApi');
const sendEmail = require('./sendEmail'); 

const sendWeeklyNewsletter = async () => {
    try {
        // Calculate the date a week ago
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Get the last 10 messages for each user
        const lastMessagesForEachUser = await Session.aggregate([
            { $unwind: '$messages' },
            { $match: { 
                'messages.role': 'user',
                'messages.createdAt': { $gt: oneWeekAgo } // Only consider messages from the last week
            } },
            { $sort: { 'messages.createdAt': -1 } },
            { $group: {
                _id: '$user',
                lastMessagesContent: { 
                    $push: '$messages.content'
                }
              }
            },
            { $project: {
                lastMessagesContent: { $slice: ['$lastMessagesContent', 10] }
              }
            },
            { $lookup: {
                from: 'users', 
                localField: '_id',
                foreignField: '_id',
                as: 'userDetails'
              }
            },
            { $unwind: '$userDetails' },
            { $project: {
                _id: 0,
                userEmail: '$userDetails.email', 
                lastMessagesContent: 1
              }
            }
        ]);

        // console.log("Last 10 messages' content for each user with email: ", lastMessagesForEachUser);
        
        // Loop through each user and their last 10 messages
        for (const user of lastMessagesForEachUser) {
            // Filter messages with token count not greater than 70
            const filteredMessages = user.lastMessagesContent.filter(message => {
                const tokenCount = message.split(/\s+/).length;
                return tokenCount <= 70;
            });

            // Only proceed if there are at least 10 messages after filtering
            if (filteredMessages.length >= 10) {
                const promptContent = filteredMessages.map((message, index) => `${index + 1}) ${message}`).join("\n");
                let newsletterContent = await openaiApi.getNewsletter(newsletterPrompt(promptContent));

                newsletterContent = `<div style="font-size: 1rem; font-family: 'Open Sans', sans-serif;">${newsletterContent}</div>`;

                if (user.userEmail) {
                    sendEmail(user.userEmail, "Your Personalized Book Recommendations Based on Your Recent Searches!", newsletterContent);
                    console.log(`Newsletter sent to ${user.userEmail}`);
                }
            }
        }
    } catch (error) {
        console.error('Error in sendWeeklyNewsletter:', error);
    }
};

module.exports = sendWeeklyNewsletter;
