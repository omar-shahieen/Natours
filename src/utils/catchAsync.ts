import type { Request, Response, NextFunction, RequestHandler } from "express";

const catchAsync = <
    Req = Request,
    Res = Response,
    Next = NextFunction,
    Return = unknown>(fn: (req: Req, res: Res, next: Next) => Promise<Return>): RequestHandler => {

    return (req, res, next) => {
        // return fn(req: Request, res: Response, next: NextFunction).catch(err => next(err));
        return fn(req as Req, res as Res, next as Next).catch(next);

    };

};

export default catchAsync;