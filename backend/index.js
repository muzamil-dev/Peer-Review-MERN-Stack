import express from "express";
import db from "./config.js";

const app = express();

await db.connect();

const res = await db.query(`
        insert into users (first_name, last_name, email, password)
        values ($1, $2, $3, $4)
    `, ['Rick1', 'Leinecker', 'rick1@ucf.edu', 'password']);

await db.end();

console.log(res);