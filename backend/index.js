import express from "express";
import pg from "pg";

const app = express();

const db = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "cdog",
    password: "password",
    database: "peer"
});

await db.connect();

const res = await db.query(`
        select *
        from users 
    `);

await db.end();

console.log(res.rows);