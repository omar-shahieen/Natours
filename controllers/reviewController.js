import Review from "../models/Review.js";
import Tour from "../models/Tour.js";
import AppError from "../utils/AppError.js";
import { getOne, createOne, deleteOne, updateOne, getAll } from "./handlerFactory.js";



export function setTourUserIds(req, res, next) {
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
}
export async function validateTourId(req, res, next) {
    if (req.body.tour) {
        const tour = await Tour.findById(req.body.tour);
        if (!tour)
            return next(new AppError("Tour with that id not exist"));
    }
    next();
}
export const getReview = getOne(Review);

export const createReview = createOne(Review);

export const deleteReview = deleteOne(Review);

export const updateReview = updateOne(Review);

export const getAllReviews = getAll(Review);