const User = require('./models/User');
const Session = require('./models/Session');
const newsletterPrompt = require('./promptNewsLetter');
const openaiApi = require('./openaiApi');
const sendEmail = require('./sendEmail'); // Assuming you have this function

const sendWeeklyNewsletter = async () => {
    try {
        // Get the last 10 messages for each user
        const lastMessagesForEachUser = await Session.aggregate([
            { $unwind: '$messages' },
            { $match: { 'messages.role': 'user' } },
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
        
        // Loop through each user and their last 2 messages
        for (const user of lastMessagesForEachUser) {
            // Generate and send newsletter if there are enough messages
            if (user.lastMessagesContent.length >= 2) {
                // Format the messages as a numbered list
                const promptContent = user.lastMessagesContent.map((message, index) => `${index + 1}) ${message}`).join("\n");
                let newsletterContent = await openaiApi.getNewsletter(newsletterPrompt(promptContent));

                newsletterContent = `<div style="font-size: 1rem; font-family: 'Open Sans', sans-serif;">${newsletterContent}</div>`;

                if (user.userEmail) {
                    sendEmail(user.userEmail, "Your Weekly Newsletter", newsletterContent);
                    console.log(`Newsletter sent to ${user.userEmail}`);
                }
            }          
        }
    } catch (error) {
        console.error('Error in sendWeeklyNewsletter:', error);
    }
};

module.exports = sendWeeklyNewsletter;
