
import type { Types } from "mongoose";
import type { ILocation } from "./location.interface.ts";

export interface ITour {
    name: string,
    maxGroupSize: number,
    price: number,
    slug: string,
    priceDiscount: number,
    duration: number,
    difficulty: 'easy' | 'medium' | 'difficult',
    ratingsAverage: number,
    ratingsQuantity: number,
    summary: string,
    description: string,
    imageCover: string,
    images: [string],
    startDates: [Date],
    createdAt: Date,
    secretTour: boolean,
    startLocation: ILocation,
    locations: ILocation[],
    guides: Types.ObjectId[],
}