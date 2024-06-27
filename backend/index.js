import express from "express";
import dotenv from "dotenv";

import db from "./config.js";

dotenv.config();

// Set the port
const PORT = process.env.PORT || 5000;

// Initialize the app
const app = express();
app.use(express.json());

// Connect to the database
await db.connect();
console.log(`Connected to the database.`); 

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}.`);
});
