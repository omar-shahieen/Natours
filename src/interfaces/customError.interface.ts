

export interface CustomError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    message: string;
    // mongoose
    path?: string;
    value?: unknown;
    errors?: Record<string, { message: string }>;
    keyValue?: Record<string, unknown>;
    code?: number;

    // jwt
    name: string;

}

