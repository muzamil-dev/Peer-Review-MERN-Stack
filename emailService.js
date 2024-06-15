import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { emailUser, emailPass } from './config.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

export const sendEmail = async (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email: ', error);
    }
};