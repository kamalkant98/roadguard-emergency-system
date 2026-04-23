import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";


const app = express();
app.use(cors({
    origin : process.env.CORS_ORIGIN
}));



app.use(express.json({limit:'20kb'}))
app.use(express.urlencoded({extended: false,limit:'20kb'}));
app.use(express.static("public"));
app.use(cookieParser());


// import router

import userRouter from "./routes/user.routes.js";
import subscribeChannelRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.use("/users", userRouter)
app.use("/channel", subscribeChannelRouter)
app.use("/video", videoRouter)

export { app }