const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, body) => {
  // Configure your mail server settings
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"ChatGPT" <anirudhatalmale4@gmail.com>',
    to: to, 
    subject: subject, 
    html: body 
  });

  console.log('Message sent: %s', info.messageId);
};

module.exports = sendEmail;