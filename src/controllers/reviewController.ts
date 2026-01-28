import type { Request, NextFunction, Response } from 'express';
import Review, { ReviewDocument } from "../models/review.model.js";
import Tour from "../models/tour.model.js";
import AppError from "../utils/AppError.js";
import FactoryController from "./factoryController.js";



const {
    getAll,
    getOne,
    createOne,
    updateOne,
    deleteOne
} = new FactoryController(Review);


class ReviewController {


    validateTourId = async (req: Request, res: Response, next: NextFunction) => {
        if (req.body.tour) {
            const tour = await Tour.findById(req.body.tour);
            if (!tour)
                return next(new AppError("Tour with that id not exist", 404));
        }

        next();
    };


    setTourUserIds(req: Request, res: Response, next: NextFunction) {

        // allow nested routes
        // if tour not provided in body, get it from params
        if (!req.body.tour && req.params.tourId) req.body.tour = req.params.tourId;

        // if user not provided in body, get it from logged-in user
        if (!req.body.user && req.user) req.body.user = req.user.id;

        next();
    }


    getAllReviews = getAll;

    getReview = getOne();

    createReview = createOne;

    deleteReview = deleteOne;

    updateReview = updateOne;

}

const reviewController = new ReviewController();

export const {
    getAllReviews,
    setTourUserIds,
    validateTourId,
    createReview,
    getReview,
    updateReview,
    deleteReview } = reviewController;

export default reviewController;


