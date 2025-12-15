import { Schema, model } from "mongoose";
import Tour from "./Tour.js";

const reviewSchema = new Schema({
    review: {
        type: String,
        required: [true, "review text is required"],
        minLength: [3, "review cant not be less than 3 charecters"],
        maxLength: [200, "review cant not be more than 200 charecters"]
    },
    rating: {
        type: Number,
        required: [true, "rating is required"],
        default: 4.5,
        max: 5,
        min: 0
    },
    tour: {
        type: Schema.Types.ObjectId,
        ref: "Tour",
        required: [true, "Review should belong to a tour"]
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Review should belong to a user"]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

//indexes
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// pre save query
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo"
    });
    next();
});

// static methods

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" }
            }
        }
    ]);


    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
}
// post doc middleware
reviewSchema.post("save", function () {
    // this points the current doc
    this.constructor.calcAverageRatings(this.tour);
})

//  query middleware

reviewSchema.pre(/^findOneAnd/, async function (next) {
    // find the document manually
    this.r = await this.model.findOne(this.getQuery());
    next();
});

// POST middleware
reviewSchema.post(/^findOneAnd/, async function () {
    if (this.r) {
        await this.r.constructor.calcAverageRatings(this.r.tour);
    }
});
const Review = model("Review", reviewSchema);

export default Review;