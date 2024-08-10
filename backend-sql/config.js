import pgPromise from 'pg-promise';
import dotenv from "dotenv";

const pgp = pgPromise();

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

const pool = pgp(supaConfig);

export default pool;