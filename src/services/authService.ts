import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { StringValue } from "ms";
import { createHash } from 'node:crypto';
import UserRepository from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";
import Email from "../utils/email.js";
import { JwtDecoded } from '../types/jwt.js';


interface SignupData {
    email: string;
    password: string;
    passwordConfirm: string;
    name: string;
}

interface LoginData {
    email: string;
    password: string;
}

class AuthService {

    private userRepo: UserRepository;

    constructor() {
        this.userRepo = new UserRepository();
    }

    // Verify JWT Token
    async verifyToken(token: string): Promise<JwtDecoded> {
        try {
            const decoded = await jwt.verify(token, process.env.JWT_SECRET!) as JwtDecoded;
            return decoded;
        } catch (error) {
            throw new AppError("Invalid token. Please log in again!", 401);
        }
    }

    signInToken = (id: string): string => {
        return jwt.sign(
            { id },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN as StringValue,
            }
        );
    };

    signup = async (req: Request, data: SignupData) => {

        const userData: SignupData = {
            email: data.email,
            password: data.password,
            passwordConfirm: data.passwordConfirm,
            name: data.name,
        };

        const newUser = await this.userRepo.create(userData);

        const url = `${req.protocol}://${req.get("host")}/me`;
        await new Email(newUser, url).sendSayWelcome();

        const token = this.signInToken(newUser._id.toString());

        return { newUser, token };
    };

    login = async (LoginData: LoginData) => {
        const { email, password } = LoginData;

        //  check if email and password exist 
        if (!email || !password)//bad request
            throw new AppError("Please provide email and password!", 400);

        // check if user is exist 
        const user = await this.userRepo.findByEmailWithPassword(email);


        if (!user || !(await user.correctPassword(password, user.password))) // unauthorized
            throw new AppError("password or email is not correct", 401);

        const token = this.signInToken(user._id.toString());

        return { user, token };
    };

    extractToken = (authHeader?: string, cookieToken?: string): string | null => {
        if (
            authHeader &&
            authHeader.startsWith("Bearer")
        )
            return authHeader.split(" ")[1] ?? null;

        if (cookieToken)
            return cookieToken;

        return null;

    };

    extractUserFromToken = async (token: string) => {
        // token verification
        const decoded = await this.verifyToken(token);

        // check if users still exist 
        const currentUser = await this.userRepo.findById(decoded.id);

        if (!currentUser)  // user delete account 
            throw new AppError("The user belonging to this token is no longer exist", 401);


        // check if user change password
        if (currentUser.hasChangePasswordAfter(decoded.iat!)) {
            throw new AppError("The user has changed passwords", 401);
        }

        return currentUser;

    };



    checkLoggedIn = async (token: string) => {
        try {
            // token verification
            const decoded = await this.verifyToken(token);

            // check if users still exist 
            const currentUser = await this.userRepo.findById(decoded.id);

            if (!currentUser)  // user delete account 
                return null;
            // check if user change password
            if (!currentUser.hasChangePasswordAfter(decoded.iat))
                return null;

            // pass
            return currentUser;
        } catch (error) {
            return null;
        }
    };

    forgetPassword = async (email: string, baseResetURL: string) => {
        // find user with this email
        const user = await this.userRepo.findByEmail(email);
        if (!user)
            throw new AppError("there is no user with email address.", 404);
        // generate random token to reset
        const token = user.generatePasswordResetToken();
        await this.userRepo.saveWithoutValidation(user);

        // send token as email
        try {
            const resetURL = baseResetURL + token;
            await new Email(user, resetURL).sendResetPassword();
        } catch (error) {
            // invalidate token and send error message
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await this.userRepo.saveWithoutValidation(user);

            // Log the actual error for debugging
            console.error('Email send error:', error);

            throw new AppError("error while sending an email , please try again later", 500);
        }
    };

    resetPassword = async (token: string, password: string, passwordConfirm: string) => {

        //  get the user based on the token
        const hashedToken = createHash("sha256").update(token).digest('hex'); //hash token
        const user = await this.userRepo.findByPasswordResetToken(hashedToken);

        // if the token is not expired update password
        if (!user)
            throw new AppError("inValid or Expired Token!", 400); // bad request

        // update password
        user.password = password;
        user.passwordConfirm = passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await this.userRepo.saveUser(user);

        // Generate new token
        const jwtToken = this.signInToken(user._id.toString());

        return { user, token: jwtToken };

    };


    updatePassword = async (userId: string, passwordCurrent: string, password: string, passwordConfirm: string) => {
        // get the user from the collection 
        const user = await this.userRepo.findByIdWithPassword(userId);

        // check if password entered is correct  
        if (!(await user.correctPassword(passwordCurrent, user.password)))
            throw new AppError("Old password is not Correct", 401); // un authorizer


        // update the user password and confirm 
        user.password = password;
        user.passwordConfirm = passwordConfirm;

        await this.userRepo.saveUser(user);

        // Generate new token
        const token = this.signInToken(user._id.toString());

        return { user, token };
    };

}


export default AuthService;