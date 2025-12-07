const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

exports.deleteOne = (model) => {
    return catchAsync(async (req, res, next) => {
        const doc = await model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError(`No document found with that ID`, 404));
        }
        res.status(204).json({
            status: 'success',
            data: null
        });

    });
}

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        runValidators: true,
        new: true
    });
    if (!doc) {
        next(new AppError("there is no document with this id", 404));
    }
    res.status(200).json({
        isSuccess: true,
        data: doc
    })
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({ //created
        isSuccess: true,
        data: {
            data: doc
        }
    })
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
        return next(new AppError('No doc found with that ID', 404));
    }
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });

});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // to allow get review in nested tour route
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };


    const features = new APIFeatures(Model.find(filter), req.query).filter().limitFields().paginate().sort();
    // const docs = await features.query.explain(); //for experiments
    const docs = await features.query;
    res.status(200).json({
        status: 'success',
        length: docs.length,
        data: {
            data: docs
        }
    })
});