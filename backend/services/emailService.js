import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();
const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
export const sendEmail = async (to, subject, message) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: message,
    };
    try {
        const emailSent = await transporter.sendMail(mailOptions);
        //console.log('Email sent successfully');
        return emailSent;
    } catch (error) {
        console.error('Error sending email: ', error);
        return {
            error: error.message,
            status: 500
        }
        return {
            error: error.message,
            status: 500
        }
    }
};