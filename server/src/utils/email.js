/**
 * Email Utility - Task Management SaaS
 */

import nodemailer from 'nodemailer';

// Create transporter for sending emails
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
export const sendEmail = async ({
  email,
  subject,
  message,
  html,
}) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text: message,
      html: html || `<p>${message}</p>`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Task Manager!',
    html: `
      <h1>Welcome ${name}! 🎉</h1>
      <p>Thank you for joining Task Manager. Start organizing your tasks today!</p>
      <a href="${process.env.CLIENT_URL}">Get Started</a>
    `,
  }),

  passwordReset: (resetURL) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset</h1>
      <p>You requested a password reset. Click the link below:</p>
      <a href="${resetURL}">Reset Password</a>
      <p>This link expires in 10 minutes.</p>
    `,
  }),

  emailVerification: (verificationURL) => ({
    subject: 'Verify Your Email',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationURL}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  }),
};

export default { sendEmail, emailTemplates };