import { dirname, join } from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import express from 'express';
import type { Request, NextFunction, Response } from 'express';
import helmet from 'helmet';
import { parse, type ParsedQs } from 'qs';
import morgan from 'morgan';
import rateLimit from "express-rate-limit";
import mongoSanitize from 'express-mongo-sanitize';
import xss from "xss";
import hpp from "hpp";
import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import viewRouter from './routes/viewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import AppError from './utils/AppError.js';
import globalErrorHandler from './controllers/errorController.js';

const fileName = fileURLToPath(import.meta.url);
const dirName = dirname(fileName);


const app = express();

/* ===============================
  Support Pug template 
================================ */
app.set("view engine", 'pug');

app.set("views", join(dirName, 'views')); //set views folder location



/* ===============================
      MiddleWares
================================ */



// ========= STATIC FILES ========= 
app.use(express.static(join(dirName, 'public')));


// ========= security headers ========= 

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["*"],
      scriptSrc: ["*", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["*", "'unsafe-inline'"],
      imgSrc: ["*", "data:"],
      fontSrc: ["*", "data:"],
      connectSrc: ["*"],
      workerSrc: ["*", "blob:"],
      objectSrc: ["*"],
      mediaSrc: ["*"],
      frameSrc: ["*"]
    }
  })
);

// ========= DEV logs ========= 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ========= limit requests from same IP========= 

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 60 minutes).
  message: "Too many request from this IP, try again in an hour!",
});
app.use("/api", limiter);

// ========= body Parser========= 
app.use(express.json({ limit: "10kb" })); // files greater than 10 kb is not accepted
app.use(cookieParser());// for cookie parsing


// ========= data santanization against NoSQl query injection ========= 

app.use((req: Request, res: Response, next: NextFunction) => {
  req.body = mongoSanitize.sanitize(req.body);
  // req.query = { ...mongoSanitize.sanitize(req.query) };
  req.params = { ...mongoSanitize.sanitize(req.params) };
  next();
});

// ========= data santanization against Xss ========= 

const sanitizeObject = (obj: Record<string, unknown>) => {

  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === "string") {
      obj[key] = xss(value);
    }
  });

};

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query as Record<string, unknown>);

  next();
});


// ========= prevent parameter pollution ========= 


app.use(hpp({
  whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', "maxGroupSize", 'difficulty', "price"]
}));

// =========  query parsing ========= 


app.set('query parser', (str: string): ParsedQs => parse(str));


/* ===============================
      ROUTES
================================ */


// ============= views Routes =========== 
app.use("/", viewRouter);


// ============= API Routes =========== 

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);


// ============= 404 not found default  route =========== 

// 404 not found route 
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// =============  Error handler middleware =========== 

app.use(globalErrorHandler);

export default app;
