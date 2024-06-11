import express from "express";
import mongoose from "mongoose";

import { PORT, mongoDBURL } from "./config.js";

import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

const app = express();

app.use(express.json());

app.use('/users', userRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/groups', groupRoutes);

mongoose.connect(mongoDBURL)
.then(() => {
    app.listen(PORT, () => {
        console.log(`Listening on PORT ${PORT}`);
    });
})
.catch((err) => {
    console.log("Noooooo!");
    console.log(err.message);
});