import type { Types } from "mongoose";

export interface IBooking {
    tour: Types.ObjectId,
    user: Types.ObjectId,
    price: number,
    createdAt: Date,
    paid: boolean;
}