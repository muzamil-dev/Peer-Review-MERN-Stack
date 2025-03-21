import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Fill in client information from .env
// const db = new pg.Client({
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME
// });

const db = new pg.Client({
  connectionString: process.env.DB_CONN_STRING,
});

export default db;
