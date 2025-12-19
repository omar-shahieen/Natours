import type { UserDocument } from "../models/User.js";
import type { Multer } from "multer";

declare global {
    namespace Express {
        interface Request {
            user?: UserDocument;      // user from auth middleware
            file?: Multer.File;       // file from multer
        }
    }
}

export { }; // important to make it a module
