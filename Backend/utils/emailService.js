import nodemailer from "nodemailer";
import User from "../models/User.js";

// Initialize nodemailer transporter
// Note: You need to set EMAIL_USER and EMAIL_PASS in your .env file
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASS || "your-app-password",
  },
});

export const sendTokenEmailNotification = async (userId, tokenNumber, title, message) => {
  try {
    if (!process.env.EMAIL_USER) {
      console.log(`[Email Mock] To User ID ${userId} - ${title}: ${message}`);
      return;
    }

    if (!userId) return;

    const user = await User.findById(userId);
    if (!user || !user.email) return;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Smart Queue System: ${title}`,
      text: `Hello ${user.name},\n\n${message}\n\nThank you for using our Smart Queue System.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent to ${user.email} for token ${tokenNumber}`);
  } catch (error) {
    console.error("Error sending email notification:", error.message);
  }
};
