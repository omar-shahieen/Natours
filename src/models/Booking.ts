import { Schema, type Types, model, Document, type CallbackWithoutResultAndOptionalError, type Query } from "mongoose";

import type { IBooking } from "../interfaces/booking.interface.ts";



export interface BookingDocument extends Document, IBooking {
    _id: Types.ObjectId;

}

const bookingSchema = new Schema({
    tour: {
        type: Schema.Types.ObjectId,
        ref: "Tour",
        required: [true, 'Booking must belong to tour'],
    },
    user: {
        type: Schema.Types.ObjectId,
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

bookingSchema.pre(/^find/, function (this: Query<BookingDocument, BookingDocument>, next: CallbackWithoutResultAndOptionalError) {
    this.populate({
        path: "tour",
        select: "name"

    }).populate("user");
    next();
})
const Booking = model<BookingDocument>("Booking", bookingSchema)
export default Booking;
