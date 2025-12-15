import { join } from "path";
import cookieParser from "cookie-parser";
import express from 'express';
import helmet from 'helmet';
import { parse } from 'qs';
import morgan from 'morgan';
import rateLimit from "express-rate-limit";
import { sanitize } from 'express-mongo-sanitize';
import xss from "xss";
import hpp from "hpp";
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import AppError from './utils/AppError.js';
import globalErrorHandler from './controllers/errorController.js';


const app = express();
// support template pug engine
app.set("view engine", 'pug');

app.set("views", join(import.meta.dirname, 'views')); //set views folder location



// 1) MIDDLEWARES
// static file
app.use(express.static(join(import.meta.dirname, 'public')));
// security headers
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["*"],
//       scriptSrc: ["*", "'unsafe-inline'", "'unsafe-eval'"],
//       styleSrc: ["*", "'unsafe-inline'"],
//       imgSrc: ["*", "data:"],
//       fontSrc: ["*", "data:"],
//       connectSrc: ["*"],
//       workerSrc: ["*", "blob:"],
//       objectSrc: ["*"],
//       mediaSrc: ["*"],
//       frameSrc: ["*"]
//     }
//   })
// );


// dev Log
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//  limit requests from same IP
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 60 minutes).
  message: "Too many request from this IP, try again in an hour!",
});
app.use("/api", limiter);

// body pasrser
app.use(express.json({ limit: "10kb" })); // files greater than 10 kb is not accepted
app.use(cookieParser());// for cookie parsing

// data santanization against NoSQl query injection
app.use((req, res, next) => {
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);
  next();
});
// data santanization against Xss

app.use((req, res, next) => {
  xss(req.body);
  xss(req.params);
  xss(req.query);
  next();
});
// prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', "maxGroupSize", 'difficulty', "price"]
}))
// for query parsing
app.set('query parser', str => parse(str));

app.use((req, res, next) => {
  next();
})

// 3) ROUTES
// views Routes
app.use("/", viewRouter);
// API Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);


// 404 not found route 
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// error handler middleware
app.use(globalErrorHandler)

export default app;
