import Stripe from 'stripe';
import catchAsync from '../utils/catchAsync.ts';
import Tour from '../models/Tour.ts';
import Booking from '../models/Booking.ts';
import { getAll, getOne, createOne, deleteOne, updateOne } from "./handlerFactory.ts";
import AppError from '../utils/AppError.ts';



export const getCheckoutSession = catchAsync(async (req, res, next) => {
    // get tour from Db
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
        return next(new AppError("Tour with that id is not found", 400));
    // create stripe session 
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",

        success_url: `${req.protocol}://${req.get("host")}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,

        customer_email: req.user.email,
        client_reference_id: req.params.tourId,

        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: "usd",
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`
                        ]
                    }
                }
            }
        ]
    });
    // send to client 
    res.status(200).json({
        status: "success",
        session
    })
})



export const createBookingCheckout = catchAsync(async (req, res, next) => {
    // TEMP SOLUTION
    const { price, tour, user } = req.query;

    if (!tour && !price && !user) return next();

    await Booking.create({
        tour,
        user,
        price
    });
    res.redirect(`${req.protocol}://${req.get("host")}/`);
})

export const getAllBookings = getAll(Booking);
export const getOneBookings = getOne(Booking);
export const createBookings = createOne(Booking);
export const deleteBookings = deleteOne(Booking);
export const updateBookings = updateOne(Booking);