
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/Tour');
const Booking = require('../models/Booking');
const factory = require("./handlerFactory");
const AppError = require('../utils/AppError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // get tour from Db
    const tour = await Tour.findById(req.params.tourId);
    if (!tour)
        return next(new AppError("Tour with that id is not found", 400));
    // create stripe session 
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



exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    // TEMP SOLUTION
    const { price, tour, user } = req.query;

    console.log(req.query);
    if (!tour && !price && !user) return next();

    const book = await Booking.create({
        tour,
        user,
        price
    });
    console.log(book);
    res.redirect(`${req.protocol}://${req.get("host")}/`);
})

exports.getAllBookings = factory.getAll(Booking);
exports.getOneBookings = factory.getOne(Booking);
exports.createBookings = factory.createOne(Booking);
exports.deleteBookings = factory.deleteOne(Booking);
exports.updateBookings = factory.updateOne(Booking);