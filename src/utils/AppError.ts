class AppError extends Error {
    private statusCode: number;

    private status: string;

    private isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message as string);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.isOperational = true;


        Error.captureStackTrace(this, this.constructor);

        Object.setPrototypeOf(this, AppError.prototype);

    }
}

export default AppError;