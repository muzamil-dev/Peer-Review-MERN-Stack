export const PORT = 3001;
export const mongoDBURL =
    "mongodb+srv://ckrick04:zTqXKXg6eM2bNfej@test.ym8e81f.mongodb.net/kazi?retryWrites=true&w=majority&appName=TEST"

import dotenv from 'dotenv';
dotenv.config();

export const emailUser = process.env.EMAIL_USER;
export const emailPass = process.env.EMAIL_PASS;