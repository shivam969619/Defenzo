import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv"
dotenv.config();
export const app = express();
import { rateLimit } from 'express-rate-limit'
import cors from "cors"
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error";
import userRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from "./routes/order.route";
import analyticsRouter from "./routes/analytics.route";
import notificationRouter from "./routes/notification.route";
import layoutRouter from "./routes/layout.route";
//body parser
app.use(express.json({ limit: "50mb" }));

//cookie parser
app.use(cookieParser());
//api request limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.


//cors=>
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
//routes
app.use('/api/v1', userRouter);
app.use('/api/v1', courseRouter);
app.use('/api/v1', orderRouter);
app.use('/api/v1', notificationRouter);
app.use('/api/v1', analyticsRouter);
app.use('/api/v1', layoutRouter);



//testing routes

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "API IS RUNNING",
    });
})


//unknown routes
app.all("*", (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
})
app.use(limiter)
app.use(ErrorMiddleware);
