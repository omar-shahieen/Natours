import type { Model, PopulateOptions, FilterQuery } from "mongoose";
import type { Request, NextFunction, Response } from 'express';

import catchAsync from "../utils/catchAsync.js";
import CrudService from "../services/curdService.js";
import BaseRepository from "../repositories/BaseRepository.js";


class FactoryController<T> {

    private repo: BaseRepository<T>;

    private service: CrudService<T>;

    constructor(private model: Model<T>) {
        this.repo = new BaseRepository(model);
        this.service = new CrudService(this.repo);
    }

    createOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await this.service.create(req.body);

        res.status(201).json({
            isSuccess: true,
            data: {
                data: doc,
            },
        });
    });

    deleteOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        await this.service.delete(req.params.id!);

        res.status(204).json({
            status: 'success',
            data: null,
        });
    });

    updateOne = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const doc = await this.service.update(req.params.id!, req.body);

        res.status(200).json({
            isSuccess: true,
            data: doc,
        });
    });

    getOne = (popOptions?: PopulateOptions | PopulateOptions[]) => {
        return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
            const doc = await this.service.getOne(req.params.id!, popOptions);

            res.status(200).json({
                status: 'success',
                data: {
                    data: doc,
                },
            });
        });
    };

    getAll = (filter?: FilterQuery<T>) => {
        return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
            // to allow get review in nested tour route
            let actualFilter = filter || {};
            if (req.params.tourId) {
                actualFilter = { ...actualFilter, tour: req.params.tourId } as FilterQuery<T>;
            }

            const docs = await this.service.getAll(req.query as Record<string, string>, actualFilter);

            res.status(200).json({
                status: 'success',
                length: docs.length,
                data: {
                    data: docs,
                },
            });
        });
    };
}

export default FactoryController;