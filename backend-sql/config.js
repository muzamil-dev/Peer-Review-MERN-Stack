import pgPromise from 'pg-promise';
import dotenv from "dotenv";

dotenv.config();

const pgp = pgPromise();

// Use the connection string directly from the environment variables
const pool = pgp({
    connectionString: process.env.DB_CONNSTRING,
    max: 30, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if a connection cannot be established
});

export default pool;
