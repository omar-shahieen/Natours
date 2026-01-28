import { Model, FilterQuery, UpdateQuery, PopulateOptions } from "mongoose";
import APIFeatures from "../utils/APIFeatures.js";

class BaseRepository<T> {

    protected model: Model<T>;

    constructor(model: Model<T>) {
        this.model = model;
    }

    async findById(id: string, popOptions?: PopulateOptions | PopulateOptions[]): Promise<T | null> {

        let query = this.model.findById(id);

        if (popOptions) query = query.populate(popOptions);

        const doc = await query;

        return doc;
    }

    async create(data: Partial<T>): Promise<T> {
        const doc = await this.model.create(data);
        return doc;
    }

    async findAll(filter: FilterQuery<T> = {}, options?: {
        queryParams?: Record<string, string> | undefined;

    }): Promise<T[]> {
        let query = this.model.find(filter);

        if (options?.queryParams) {
            const features = new APIFeatures(query, options.queryParams)
                .filter()
                .limitFields()
                .paginate()
                .sort();

            query = features.query;
        }

        const docs: T[] = await query;
        return docs;
    }

    async delete(id: string): Promise<T | null> {
        const doc = await this.model.findByIdAndDelete(id);
        return doc;
    }

    async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
        const doc = await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });

        return doc;
    }

}

export default BaseRepository;
