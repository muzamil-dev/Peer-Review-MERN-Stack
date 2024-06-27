import pg from "pg"

const db = new pg.Client({
    host: "localhost",
    port: 5433,
    user: "cdog",
    password: "password",
    database: "peer"
});

export default db;