import type { NextFunction, Response, Request } from 'express';
import Booking from "../models/Booking.js";
import Tour from "../models/Tour.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";


export const getOverview = catchAsync(async (req: Request, res: Response) => {
    // get tour data from collectoin 
    const tours = await Tour.find();

    // build template
    // render template
    res.status(200).render("overview", {
        title: "All Tours",
        tours
    });
});
export const getTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    //get tour data
    // const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    //     path: "reviews",
    //     fields: "review rating user"
    // });
    const tour = await Tour.findOne({ slug: req.params.slug }).populate("reviews");

    if (!tour)
        return next(new AppError("no tour with this name", 404));

    res.status(200).render("tour", {
        title: tour.name,
        tour
    });
});


export function getLoginForm(req: Request, res: Response) {

    res.status(200).render("login", {
        title: "log Into your account"
    });
}

export function getMe(req: Request, res: Response) {

    res.status(200).render("account", {
        title: "Your Account"
    });
}

export const getMyTours = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const booking = await Booking.find({ user: req.user!.id });

    const tourIds = booking.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render("overview", {
        title: "My Tours",
        tours
    });


});