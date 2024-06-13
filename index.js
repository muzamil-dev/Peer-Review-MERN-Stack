import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { PORT, mongoDBURL } from "./config.js";

import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use('/users', userRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/groups', groupRoutes);
app.use('/reviews', reviewRoutes);

mongoose.connect(mongoDBURL,{
}).then(() => {
    console.log('Connected to Database!');
    //root route
    app.get('/', (req, res) => {
        res.send('Welcome to the Peer Review MERN Stack Application!');
    });
    app.listen(PORT, () => {
        console.log(`Listening on PORT ${PORT}`);
    });
}).catch((err) => {
    console.log("Noooooo!");
    console.log(err.message);
});