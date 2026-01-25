import { Schema, model, Document } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import type { Query, Types } from 'mongoose';
import type { IUser } from '../interfaces/user.interface.js';


export interface UserDocument extends IUser, Document {
    _id: Types.ObjectId;
    correctPassword(candidatePassword: string, password: string): Promise<boolean>,
    generatePasswordResetToken(): string,
    hasChangePasswordAfter(jwtToken: number): boolean,

}

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "email field is required"],
        trim: true,
        unique: true,
        validate: [validator.isEmail, 'Invalid Email address'],
        lowercase: true
    },
    role: {
        type: String,
        enum: ["user", "guide", "lead-guide", "admin"],
        default: "user"
    },
    password: {
        type: String,
        required: [true, "password field is required"],
        trim: true,
        minlength: [8, "password should be more than or equal 8 characters"],
        select: false //not selecting in query
    },
    passwordConfirm: {
        type: String,
        required: [true, "passwordConfirm field is required"],
        trim: true,
        validate: {
            validator: function (val) {
                return this.password === val; // onsave only
            },
            message: "Passwords do not match."
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        select: false,
        default: true
    },
    name: {
        type: String,
        required: [true, "name field is required"],
        trim: true,
        minlength: [3, "name should be more than or equal 3 characters"],
        maxlength: [50, "name should be less than or equal 50 characters"],
    },
    photo: {
        type: String,
        default: "default.jpg"
    }
});

// pre save hooks
userSchema.pre<UserDocument>("save", async function (next) {
    // if password not modified go the next middleware
    if (!this.isModified("password")) return next();

    // hash the password with salt 12 
    this.password = await bcrypt.hash(this.password, 12);

    // delete passwordConfirm field 
    this.passwordConfirm = undefined;


    next();
});


userSchema.pre<UserDocument>("save", function (next) {
    // if password not modified go the next middleware
    if (!this.isModified("password") || this.isNew) return next();

    this.passwordChangedAt = new Date(Date.now() - 1000); // because saving to db slower than issuing the token so it may not worked 
    next();
});

// query middleWares 
userSchema.pre<Query<UserDocument, UserDocument>>(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});



// instance methoes
userSchema.methods.correctPassword = async (candidatePassword: string, password: string): Promise<boolean> => {
    // this.password not available because select set to true 
    const isCorrect = await bcrypt.compare(candidatePassword, password);
    return isCorrect;
};

userSchema.methods.hasChangePasswordAfter = function (this: UserDocument, jwtToken: number): boolean {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return jwtToken < changedTimestamp;
    }
    // false mean not change and pass
    return false;
};


userSchema.methods.generatePasswordResetToken = function (this: UserDocument): string {
    const resetToken = crypto.randomBytes(32).toString("hex"); // create random token
    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest('hex'); // hash token to db
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now 
    return resetToken; // return the  unIncrepted token to send it by email 
};

const User = model<UserDocument>("User", userSchema);

export default User;