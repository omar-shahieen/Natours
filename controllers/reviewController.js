const Review = require("../models/Review");
const Tour = require("../models/Tour");
const AppError = require("../utils/AppError");
const factory = require("./handlerFactory");



exports.setTourUserIds = (req, res, next) => {
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
}
exports.validateTourId = async (req, res, next) => {
    if (req.body.tour) {
        const tour = await Tour.findById(req.body.tour);
        if (!tour)
            return next(new AppError("Tour with that id not exist"));
    }
    next();
}
// CRUD for reviws
exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.getAllReviews = factory.getAll(Review);