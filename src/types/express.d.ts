import type { Multer } from "multer";
import type { UserDocument } from "../models/User.js";

declare global {
    namespace Express {
        interface Request {
            user?: UserDocument;      // user from auth middleware
            file?: Multer.File;       // file from multer
            coordinates?: { lat: number; lng: number };
        }
    }
}

export { }; // important to make it a module
