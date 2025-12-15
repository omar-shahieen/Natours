const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
        required: [true, "Booking must belong to tour"]
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Booking must belong to user"]

    },
    price: {
        type: Number,
        required: [true, "Booking must have a Price"]
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    paid: {
        type: Boolean,
        default: true
    }

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: "tour",
        select: "name"

    }).populate("user");
    next()
})
const Booking = mongoose.model("Booking", bookingSchema)
module.exports = Booking;