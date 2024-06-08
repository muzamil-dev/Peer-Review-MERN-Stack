import express from "express";
import mongoose from "mongoose";

import { PORT, mongoDBURL } from "./config.js";
import { User } from "./models/userModel.js";

const app = express();

app.use(express.json());

mongoose.connect(mongoDBURL)
.then(async() => {
    app.listen(PORT, () => {
        console.log(`Listening on PORT ${PORT}`);
    });
})
.catch((err) => {
    console.log("Noooooo!");
    console.log(err.message);
});