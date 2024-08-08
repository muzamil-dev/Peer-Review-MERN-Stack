import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Fill in pool information from .env
export const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

export const supaConfig = {
    connectionString: process.env.DB_CONNSTRING
};

const pool = new pg.Pool(supaConfig);

export default pool;