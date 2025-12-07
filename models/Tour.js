const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A tour must have a name"],
        unique: true,
        trim: true,
        minlength: [10, "A tour nume must have more than or equal to 10 characters"],
        maxlength: [40, "A tour nume must have less than  or equal to 40 characters"]
    },
    maxGroupSize: {
        type: Number,
        required: [true, "A tour must have a maxGroupSize"],
    },
    price: {
        type: Number,
        required: [true, "A tour must have a price"]
    },
    slug: String,
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (value) {
                // this point to the current doc being  new created  not work with update
                return value < this.price;
            },
            message: "Discount Price ({VALUE}) should be less than the actual price"
        }
    },
    duration: {
        type: Number,
        required: [true, "A tour must have a duration"]
    },
    difficulty: {
        type: String,
        required: [true, "A tour must have a difficulty"],
        trim: true,
        enum: {
            values: ["easy", "medium", "difficult"],
            message: "Tour Difficulty must be : easy , medium , difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, "Rating must be above 1.0"],
        max: [5, "Rating must be below 5.0"],
        set: val => Math.round(val * 10) / 10 // 4.67 -> 46.7 -> 47 -> 4.7  
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    summary: {
        type: String,
        required: [true, "A tour must have a summary"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, "A tour must have an imageCover"],
        trim: true
    },
    images: [String],
    startDates: [Date],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    secretTour: {
        type: Boolean,
        default: false,
    }, startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ["Point"]
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            //GeoJson
            type: {
                type: String,
                default: "Point",
                enum: ["Point"]
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number // day for this location
        }
    ],
    guides: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// indexes 
tourSchema.index({ price: 1, ratingsAverage: -1 }); // compound index
tourSchema.index({ slug: 1 }); // field index
tourSchema.index({ startLocation: "2dsphere" }); // field index for geospecial data
// virtual fields
tourSchema.virtual('durationWeeks').get(function () { // function give access to this keyword
    return this.duration / 7;
});
// virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// DOCUMENT middleware : this point to documnet processed

// runs before .save and .create 
tourSchema.pre('save', function (next) { // pre save hook
    this.slug = slugify(this.name, { lower: true });
    next();
})


// QUERY middlewares : this point to query
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } }); // Documents where secretTour is false or missing or undefined
    next()
})

tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-__v -passwordChangedAt"
    }); // create a new query for guides 
    next();
})
tourSchema.pre(/^findOne/, function (next) {
    this.populate({
        path: "reviews",
    }); // populate reviews
    next();
})
// aggregate middleware : this points to aggregate obj
// tourSchema.pre("aggregate", function (next) {
//     this.pipeline().unshift({
//         $match: { secretTour: { $ne: true } }
//     })
//     next()
// })
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;