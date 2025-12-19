import type { Request, NextFunction, Response } from 'express';
import Review from "../models/Review.js";
import Tour from "../models/Tour.js";
import AppError from "../utils/AppError.js";
import { getOne, createOne, deleteOne, updateOne, getAll } from "./handlerFactory.js";



export function setTourUserIds(req: Request, res: Response, next: NextFunction) {
    // allow nested routes
    // if tour not provided in body, get it from params
    if (!req.body.tour && req.params.tourId) req.body.tour = req.params.tourId;

    // if user not provided in body, get it from logged-in user
    if (!req.body.user && req.user) req.body.user = req.user.id;
    next();
}
export async function validateTourId(req: Request, res: Response, next: NextFunction) {
    if (req.body.tour) {
        const tour = await Tour.findById(req.body.tour);
        if (!tour)
            return next(new AppError("Tour with that id not exist", 404));
    }
    next();
}
export const getReview = getOne(Review);

export const createReview = createOne(Review);

export const deleteReview = deleteOne(Review);

export const updateReview = updateOne(Review);

export const getAllReviews = getAll(Review);