import { ParsedQs } from "qs";
import { UserDocument } from "../models/user.model.js";
import UserRepository from "../repositories/userRepository.js";
import AppError from "../utils/AppError.js";
import cacheService from "./cacheService.js";


class UserService {
    private userRepo: UserRepository;

    private readonly CACHE_PREFIX = 'user';

    private readonly USER_TTL = 1800; // 30 minutes

    constructor() {
        this.userRepo = new UserRepository();
    }

    private filterObj = <T extends Record<string, unknown>>(obj: T, ...allowedFields: (keyof T)[]): Partial<T> => {
        const newObj: Partial<T> = {};
        Object.keys(obj).forEach(key => {
            if (allowedFields.includes(key as keyof T))
                newObj[key as keyof T] = obj[key as keyof T];
        });
        return newObj;
    };

    getUserById = async (id: string) => {
        const cacheKey = `${this.CACHE_PREFIX}:${id}`;

        const cached = await cacheService.get(id);

        if (cached) return cached;


        const user = await this.userRepo.findById(id);

        if (!user) {
            throw new AppError("No user found with that ID", 404);
        }

        await cacheService.set(cacheKey, user, this.USER_TTL);


        return user;

    };


    getAllUsers = async (query?: Record<string, string>, filter = {}): Promise<UserDocument[]> => {
        const users = await this.userRepo.findAll(filter, { queryParams: query });

        return users;

    };

    createUser = async (data: UserDocument) => {

        const user = await this.userRepo.create(data);

        await this.invalidateUserCaches();

        return user;

    };

    updateUser = async (id: string, data: UserDocument) => {

        const user = await this.userRepo.update(id, data);
        if (!user) {
            throw new AppError("No user found with that ID", 404);
        }
        await cacheService.del(`${this.CACHE_PREFIX}:${id}`);

        await this.invalidateUserCaches();

        return user;

    };

    deleteUser = async (id: string) => {
        const user = await this.userRepo.delete(id);

        if (!user) {
            throw new AppError("No user found with that ID", 404);
        }

        await cacheService.del(`${this.CACHE_PREFIX}:${id}`);


        return user;
    };

    private invalidateUserCaches = async () => {
        await cacheService.delPattern("api:/users*");
    };


    updateMe = async (userId: string, userData: Partial<UserDocument>) => {


        // create error if user posts password data 
        if (userData.password || userData.passwordConfirm)
            throw new AppError("You can not update password here ,user route /updateMyPassword", 400); // bad req

        // filter out unWanted Data
        const filteredObj = this.filterObj(userData, "name", "email", "photo");

        // updateUser datas
        const user = await this.userRepo.update(userId, filteredObj);

        return user;

    };

    deActivateUser = async (userId: string): Promise<void> => {
        const user = await this.userRepo.deActivateUser(userId);

        if (!user) {
            throw new AppError("User not found", 404);
        }

    };




}


export default UserService;