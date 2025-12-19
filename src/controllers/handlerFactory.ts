import type { Model, Document, PopulateOptions } from "mongoose";
import type { Request, NextFunction, Response } from 'express';
import APIFeatures from "../utils/APIFeatures.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

export function deleteOne<T extends Document>(model: Model<T>) {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await model.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError(`No document found with that ID`, 404));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });

    });
}

export function updateOne<T extends Document>(model: Model<T>) {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
            runValidators: true,
            new: true,
        });
        if (!doc) {
            next(new AppError("there is no document with this id", 404));
        }
        res.status(200).json({
            isSuccess: true,
            data: doc,
        });
    });
}

export function createOne<T extends Document>(model: Model<T>) {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await model.create(req.body);

        res.status(201).json({ //created
            isSuccess: true,
            data: {
                data: doc,
            },
        });
    });
}

export function getOne<T extends Document>(model: Model<T>, popOptions?: PopulateOptions | PopulateOptions[]) {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        let query = model.findById(req.params.id);

        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        if (!doc) {
            return next(new AppError('No doc found with that ID', 404));
        }
        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        });

    });
}

export function getAll<T extends Document>(model: Model<T>) {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // to allow get review in nested tour route
        let filter = {};
        if (req.params.tourId) filter = { tour: req.params.tourId };


        const features = new APIFeatures(model.find(filter), req.query as unknown as Record<string, string>).filter().limitFields().paginate().sort();

        // const docs = await features.query.explain(); //for experiments
        const docs: T[] = await features.query;

        res.status(200).json({
            status: 'success',
            length: docs.length,
            data: {
                data: docs,
            },
        });
    });
}