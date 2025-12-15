const path = require("path");
const cookieParser = require("cookie-parser");
const express = require('express');
const helmet = require('helmet');
const qs = require('qs');
const morgan = require('morgan');
const rateLimit = require("express-rate-limit");
const mongoSanitize = require('express-mongo-sanitize');
const xss = require("xss");
const hpp = require("hpp");
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();
// support template pug engine
app.set("view engine", 'pug');

app.set("views", path.join(__dirname, 'views')); //set views folder location



// 1) MIDDLEWARES
// static file
app.use(express.static(path.join(__dirname, 'public')));
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
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
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
app.set('query parser', str => qs.parse(str));

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

module.exports = app;
