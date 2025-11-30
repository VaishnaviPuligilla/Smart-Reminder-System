const nodemailer = require('nodemailer');

console.log('Initializing email service...');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('Email credentials missing!');
  console.error('Please set EMAIL_USER and EMAIL_PASS in .env file');
}

// ✅ FIXED: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Email service configuration error:', error);
  } else {
    console.log('Email service is ready to send messages');
    console.log('Account:', process.env.EMAIL_USER);
  }
});

exports.sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: `OnTime App <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    console.log('Message ID:', info.messageId);
    return info;
  } catch (err) {
    console.error('Email sending failed:', err.message);
    throw err;
  }
};