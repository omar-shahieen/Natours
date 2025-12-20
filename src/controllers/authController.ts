import { createHash } from 'crypto';
import type { Request, NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { StringValue } from "ms";
import User from '../models/User.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import Email from '../utils/email.js';
import type { UserDocument } from '../models/User.js';
import type { JwtDecoded } from '../types/jwt.js';
import type { UserRole } from '../interfaces/user.interface.js';

// TODO Later : create max attempt login 
// TODO Later : prevent cross site request forgery (csurf package)
// TODO Later : create blackList of unTrasted JWT
// TODO Later : Confirm email after creating account 
// TODO Later : Refresh Token
// TODO Later : 2FA

export const signInToken = (id: string): string => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
        }
    );
};
const createSendToken = (user: UserDocument, statusCode: number, res: Response): void => {
    const token = signInToken(user._id.toString());
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
    // eslint-disable-next-line 
    (user.password as any) = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};


export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userData = {
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        name: req.body.name,
    };

    const newUser = await User.create(userData);
    const url = `${req.protocol}://${req.get("host")}/me`;
    await new Email(newUser, url).sendSayWelcome();
    createSendToken(newUser, 201, res);
});

export function logout(req: Request, res: Response) {
    res.cookie("jwt", "invalid Token", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({
        status: "success",
    });

}

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //  TODO Later : create max attempt login
    const { email, password } = req.body;
    //  check if email and password exist 
    if (!email || !password)//bad request
        return next(new AppError("Please provide email and password!", 400));
    // check if user is exist 

    const user: UserDocument = await User.findOne({ email }).select(['email', 'password']);

    if (!user || !(await user.correctPassword(password, user.password))) // unauthorized
        return next(new AppError("password or email is not correct", 401));

    // generate token
    createSendToken(user, 200, res);

});


export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // check if token exist 
    let token: string | undefined;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    )
        token = req.headers.authorization.split(" ")[1];
    else if (req.cookies.jwt)
        token = req.cookies.jwt;

    if (!token) {
        return next(
            new AppError("You are not logged in! Please log in to get access.", 401)
        );
    }
    // token verification
    const decoded = await jwt.verify(token, process.env.JWT_SECRET) as JwtDecoded;
    // check if users still exist 
    const currentUser = await User.findById(decoded.id);
    if (!currentUser)  // user delete account 
        return next(new AppError("The user belonging to this token is no longer exist", 401));
    // check if user change password
    if (currentUser.hasChangePasswordAfter(decoded.iat!)) {
        return next(
            new AppError("The user has changed passwords", 401)
        );
    }
    // pass
    res.locals.user = currentUser;
    req.user = currentUser;


    next();
});

export async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
    try {
        // check if token exist 
        if (req.cookies.jwt) {
            const token = req.cookies.jwt;
            // token verification
            const decoded = await jwt.verify(token, process.env.JWT_SECRET) as JwtDecoded;

            // check if users still exist 
            const currentUser = await User.findById(decoded.id);

            if (!currentUser)  // user delete account 
                return next();
            // check if user change password
            if (!currentUser.hasChangePasswordAfter(decoded.iat))
                return next();
            // pass to pug template
            res.locals.user = currentUser;
            return next();
        }
    } catch (error) {
        return next();

    }

    next();

}


export function restrictTo(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // roles ['admin', 'lead-guide']. role='user'
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
}
export const forgetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // find user with this email
    const user = await User.findOne({ email: req.body.email });
    if (!user)
        return next(new AppError("there is no user with email address.", 404));
    // generate random token to reset
    const token = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // send token as email
    try {
        const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${token}`;
        await new Email(user, resetURL).sendResetPassword();
        res.status(200).json({
            isSuccess: true,
            message: "reset token sent to email",
            // we don't sent token as res because with this token any one can reset anyone pass 
        });
    } catch (error) {
        // invalidate token and send error message
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save({ validateBeforeSave: false });
        return next(new AppError("error while sending an email , please try again later", 500));
    }
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.token) {
        return next(new AppError("Token not provided!", 400));
    }
    //  get the user based on the token
    const hashedToken = createHash("sha256").update(req.params.token).digest('hex'); //hash token
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    }); // search in db by the token

    // if the token is not expired update password
    if (!user)
        return next(new AppError("inValid or Expired Token!", 400)); // bad request
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // update changedpassword at property
    // log the user in , send jwt token
    createSendToken(user, 200, res);

});
export const updatePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // get the user from the collection 
    const user = await User.findById(req.user!.id).select("+password") as UserDocument; // req.user from protected route // - select because we exclude password from select


    // check if password entered is correct  
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
        return next(new AppError("Old password is not Correct", 401)); // un authorizer


    // update the user password and confirm 
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save(); // findById not work because validation
    // log user in 
    createSendToken(user, 200, res);

});