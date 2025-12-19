import mongoose, { Schema, Document } from "mongoose";
import type { Query, Types, Model } from "mongoose";
import Tour from "./Tour.js";
import type { IReview } from "../interfaces/review.interface.ts";


export interface ReviewDocument extends IReview, Document {
    _id: Types.ObjectId;

}
interface ReviewQuery extends Query<ReviewDocument, ReviewDocument> {
    reviewDoc?: ReviewDocument | null;
}
interface ReviewModel extends Model<ReviewDocument> {
    calcAverageRatings(tourId: Types.ObjectId): Promise<void>;
}


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
});

//indexes
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// pre save query
reviewSchema.pre<Query<ReviewDocument, ReviewDocument>>(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name photo"
    });
    next();
});

// static methods

reviewSchema.statics.calcAverageRatings = async function (this: Model<ReviewDocument>, tourId: Types.ObjectId): Promise<void> {
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
};

// post doc middleware
reviewSchema.post('save', function (this: ReviewDocument) {
    const model = this.constructor as ReviewModel;
    model.calcAverageRatings(this.tour);
});

//  query middleware

reviewSchema.pre(/^findOneAnd/, async function (this: ReviewQuery, next) {
    // find the document manually
    this.reviewDoc = await this.model.findOne(this.getQuery());
    next();
});

// POST middleware
reviewSchema.post(/^findOneAnd/, async function (this: ReviewQuery) {
    if (this.reviewDoc) {
        const model = this.reviewDoc.constructor as ReviewModel;
        await model.calcAverageRatings(this.reviewDoc.tour);
    }
});
const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);

export default Review;