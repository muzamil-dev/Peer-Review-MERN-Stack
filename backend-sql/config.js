import dotenv from "dotenv";
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

// Fill in pool information from .env
export const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Create a new Pool instance
const pool = new Pool({
    connectionString: process.env.DB_CONNSTRING,
    max: 30, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if a connection cannot be established
});

// Function to execute queries with proper connection management
export const query = async (text, params) => {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release(); // Properly release the client back to the pool
    }
};

export default pool;
