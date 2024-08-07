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

const pool = new pg.Pool(dbConfig);

//comment this in to connect to DB locally 
// const pool = new pg.Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//         rejectUnauthorized: false, // This might be necessary for some cloud services
//     },
// });

export default pool;