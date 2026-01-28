import type { Request, NextFunction, Response } from 'express';

import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import type { UserDocument } from '../models/user.model.js';
import type { UserRole } from '../interfaces/user.interface.js';
import AuthService from '../services/authService.js';

// TODO Later : create max attempt login 
// TODO Later : prevent cross site request forgery (csurf package)
// TODO Later : create blackList of unTrasted JWT
// TODO Later : Confirm email after creating account 
// TODO Later : Refresh Token
// TODO Later : 2FA

type SanitizedUser = Omit<UserDocument, 'password'>;

function sanitizeUser(user: UserDocument): SanitizedUser {
    const { password, ...sanitized } = user.toObject();
    return sanitized;
}

const createSendToken = (user: UserDocument, token: string, statusCode: number, res: Response): void => {
    // set cookies
    const cookieOptions: {
        expires: Date;
        httpOnly: boolean;
        secure?: boolean;
    } = {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPERIES_IN) * 24 * 60 * 60 * 1000),
        httpOnly: true, // can not be edited or accessed by browser
    };

    if (process.env.NODE_ENV === "production") cookieOptions.secure = true; // sent on https only

    res.cookie("jwt", token, cookieOptions);


    //delete password from user in res 
    const sanitizedUser = sanitizeUser(user);

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            sanitizedUser,
        },
    });
};


class AuthController {

    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

        const { newUser, token } = await this.authService.signup(req, req.body);


        createSendToken(newUser, token, 201, res);
    });

    logout = (req: Request, res: Response) => {

        res.cookie("jwt", "invalid Token", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        });


        res.status(200).json({
            status: "success",
        });

    };


    login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        //  TODO Later : create max attempt login

        const { user, token } = await this.authService.login(req.body);
        // generate token
        createSendToken(user, token, 200, res);

    });



    protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // check if token exist 
        const token = this.authService.extractToken(req.headers.authorization, req.cookies.jwt);


        if (!token) {
            return next(
                new AppError("You are not logged in! Please log in to get access.", 401)
            );
        }

        // get current user from token
        const currentUser = await this.authService.extractUserFromToken(token);

        // pass
        res.locals.user = currentUser;
        req.user = currentUser;


        next();
    });

    isLoggedIn = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies.jwt;

            if (!token) {
                return next();
            }

            const currentUser = await this.authService.checkLoggedIn(token);

            if (currentUser) {
                res.locals.user = currentUser;
            }

            next();
        } catch (error) {
            return next();

        }
    };


    restrictTo = (...roles: UserRole[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            // roles ['admin', 'lead-guide']. role='user'
            if (!req.user || !roles.includes(req.user.role)) {
                return next(
                    new AppError('You do not have permission to perform this action', 403)
                );
            }
            next();
        };
    };


    forgetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

        const { email } = req.body;

        if (!email) {
            return next(new AppError("Please provide an email address", 400));
        }


        const baseResetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/`;

        await this.authService.forgetPassword(email, baseResetURL);


        res.status(200).json({
            isSuccess: true,
            message: "reset token sent to email",
            // we don't sent token as res because with this token any one can reset anyone pass 
        });

    });

    resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { token } = req.params;
        const { password, passwordConfirm } = req.body;


        if (!token) {
            return next(new AppError("Token not provided!", 400));
        }

        const { user, token: jwtToken } = await this.authService.resetPassword(token, password, passwordConfirm);


        createSendToken(user, jwtToken, 200, res);

    });

    updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { passwordCurrent, password, passwordConfirm } = req.body;

        if (!req.user?.id) {
            return next(new AppError("User not authenticated", 401));
        }

        const { user, token } = await this.authService.updatePassword(req.user.id, passwordCurrent, password, passwordConfirm);

        createSendToken(user, token, 200, res);

    });
}


const authController = new AuthController();

export const {
    signup,
    login,
    logout,
    forgetPassword,
    resetPassword,
    protect,
    isLoggedIn,
    updatePassword,
    restrictTo } = authController;

export default authController;