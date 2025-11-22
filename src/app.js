import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()

//cors = cross origin resource sharing..
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

//common middleware...
app.use(express.json({limit: "16kb"}))//tells how much data should it use..
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))   //anything like image or something which i serve this will static and in folder public..
app.use(cookieParser())


///import routes..
import healthCheckRouter from "./routes/healthcheck.routes.js"
import userRouter from "./routes/user.routes.js"





//routes..
app.use("/api/v1/healthcheck", healthCheckRouter)  //once we passed after healthcheck, everthing will be handled by healthcheckRouter(it is on the healthcheck.routes.js)..
app.use("/api/v1/users", userRouter) //after use the control will go to userRouter..   & from userRouter it will go to userController through registerUser..


// app.use(errorHandler)

export {app}