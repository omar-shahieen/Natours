import AppError from "../utils/AppError.ts";

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
// Send detailed errors during development
const ErrorToDev = (err, req, res) => {
    // If the request is for the API, send JSON response
    if (req.originalUrl.startsWith("/api")) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,          // full error object
            stack: err.stack     // stack trace for debugging
        });
    }

    // Otherwise, render the error page for the website
    res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        message: err.message
    });
};


// Send simplified, safe errors during production
const ErrorToProd = (err, req, res) => {
    // API ERROR HANDLING
    if (req.originalUrl.startsWith("/api")) {

        // Case 1: Operational trusted error → send readable message
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }

        // Case 2: Unknown or programming error → do NOT leak details
        console.error("ERROR:", err);

        return res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        });
    }

    // WEBSITE ERROR HANDLING
    if (err.isOperational) {
        // Send user-friendly error page
        return res.status(err.statusCode).render("error", {
            title: "Something went wrong!",
            message: err.message
        });
    }

    // Programming or unknown error → log & send generic message
    console.error("ERROR:", err);

    res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        message: "Please call support for assistance."
    });
};

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
        ErrorToDev(err, req, res);
    else if (process.env.NODE_ENV === "production") {
        let error = JSON.parse(JSON.stringify(err));//deep copy
        //mongoose errors
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.name === 'ValidationError') error = handleValidatorErrorDB(error);
        if (error.code === 11000) error = handleDuplicateKeyDB(error);
        //jwt errors
        if (error.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
        if (error.name === 'TokenExpiredError') error = handleExpiredTokenError();
        ErrorToProd(error, req, res);
    }



}
export default globalErrorHandler;