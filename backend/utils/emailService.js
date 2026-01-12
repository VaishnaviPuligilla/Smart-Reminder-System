import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error.message);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

export const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`SMTP_EMAIL configured: ${process.env.SMTP_EMAIL ? 'Yes' : 'No'}`);
    console.log(`SMTP_PASSWORD configured: ${process.env.SMTP_PASSWORD ? 'Yes' : 'No'}`);
    
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.response);
    console.log('Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return false;
  }
};

export const sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reminder Notification System - Email Verification</h2>
      <p>Hello,</p>
      <p>Your OTP for email verification is:</p>
      <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">
        © 2025 Reminder Notification System. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(email, 'Email Verification OTP', html);
};

export const sendReminderNotification = async (email, reminderName, reminderDescription) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">🔔 Reminder Notification</h2>
      <p>Hello,</p>
      <p>This is your reminder notification:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50;">
        <h3>${reminderName}</h3>
        <p>${reminderDescription || 'No description provided'}</p>
      </div>
      <p>Don't forget to complete this task!</p>
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">
        © 2025 Reminder Notification System. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(email, `Reminder: ${reminderName}`, html);
};

export const sendPasswordResetEmail = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reminder Notification System - Password Reset</h2>
      <p>Hello,</p>
      <p>Your OTP for password reset is:</p>
      <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #666;">
        © 2025 Reminder Notification System. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(email, 'Password Reset OTP', html);
};
