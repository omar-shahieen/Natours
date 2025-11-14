const AppError = require("../utils/AppError")

const handleCastErrorDB = (err) => {
    const msg = `invalid ${err.path} : ${err.value}`;
    return new AppError(msg, 400);
}
const handleDuplicateKeyDB = (err) => {
    const msg = `Diplicate value : ${err.keyValue.name} , please use another value`;
    return new AppError(msg, 400);
}
const handleValidatorErrorDB = (err) => {
    const Errors = Object.values(err.errors).map(el => el.message);
    const msg = `Invalid Input data. ${Errors.join(", ")}`;
    return new AppError(msg, 400);
}
const ErrorToDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    })
}
const ErrorToProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        // Programming or other unknown error: don't leak error details
    } else {
        // 1) Log error
        console.error('ERROR :', err);
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
}
const handleJsonWebTokenError = () => {
    return new AppError(`Invalid token  , please logIn again`, 401);
}
const handleExpiredTokenError = () => {
    return new AppError(`Expired token  , please logIn again`, 401);
}

const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === "development")
        ErrorToDev(err, res);
    else if (process.env.NODE_ENV === "production") {
        let error = JSON.parse(JSON.stringify(err));//deep copy
        //mongoose errors
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.name === 'ValidationError') error = handleValidatorErrorDB(error);
        if (error.code === 11000) error = handleDuplicateKeyDB(error);
        //jwt errors
        if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
        if (error.name === 'TokenExpiredError') error = handleExpiredTokenError();
        ErrorToProd(error, res);
    }



}
module.exports = globalErrorHandler;