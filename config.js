import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Fill in pool information from .env
const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

export default pool;