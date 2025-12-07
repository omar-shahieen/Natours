const express = require('express');
const helmet = require('helmet');
const qs = require('qs');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require("xss-clean");
const hpp = require("hpp");
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) MIDDLEWARES
// security headers
app.use(helmet());
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
// for query parsing
app.set('query parser', str => qs.parse(str));
// body pasrser
app.use(express.json({ limit: "10kb" })); // files greater than 10 kb is not accepted

// data santanization against NoSQl query injection
// app.use(mongoSanitize());
// data santanization against Xss
// app.use(xss());
// prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', "maxGroupSize", 'difficulty', "price"]
}))
// static file
app.use(express.static(`${__dirname}/public`));
// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);


// 404 not found route 
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// error handler middleware
app.use(globalErrorHandler)

module.exports = app;
