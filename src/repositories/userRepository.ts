import { FilterQuery } from "mongoose";
import User, { UserDocument } from "../models/user.model.js";
import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository<UserDocument> {
    constructor() {
        super(User);
    }

    deActivateUser = async (userId: string): Promise<UserDocument | null> => {
        const user = await this.model.findByIdAndUpdate(userId, { active: false }, {
            new: true,
            runValidators: true
        });

        return user;
    };



    findByEmail = async (email: string): Promise<UserDocument | null> => {
        const users = await this.findAll({ email } as FilterQuery<UserDocument>);
        return users[0] || null;
    };

    // Find user by email with password field included
    findByEmailWithPassword = async (email: string): Promise<UserDocument | null> => {
        const user = await this.model.findOne({ email }).select('+password').exec();
        return user;
    };


    findByIdWithPassword = async (userId: string) => {
        return await this.model.findById(userId).select("+password") as UserDocument;
    };

    saveWithoutValidation = async (user: UserDocument) => {
        user = await user.save({ validateBeforeSave: false });

        return user;
    };

    saveUser = async (user: UserDocument) => {
        user = await user.save();

        return user;
    };

    findByPasswordResetToken = async (token: string) => {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() },
        });

        return user;
    };

}


export default UserRepository;
