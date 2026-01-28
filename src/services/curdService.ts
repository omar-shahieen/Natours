import { PopulateOptions } from "mongoose";
import AppError from "../utils/AppError.js";
import BaseRepository from "../repositories/BaseRepository.js";


class CrudService<T> {

    constructor(private repo: BaseRepository<T>) {
    }

    async getAll(query?: Record<string, string>, filter = {}): Promise<T[]> {

        const docs = await this.repo.findAll(filter, { queryParams: query });

        return docs;
    }

    async getOne(id: string, populate?: PopulateOptions | PopulateOptions[]): Promise<T | null> {
        const doc = await this.repo.findById(id, populate);

        if (!doc) {
            throw new AppError("No document found with that ID", 404);
        }

        return doc;
    }

    async create(data: Partial<T>): Promise<T> {
        const doc = await this.repo.create(data);

        return doc;
    }

    async update(id: string, data: Partial<T>): Promise<T | null> {
        const doc = await this.repo.update(id, data);

        if (!doc) {
            throw new AppError("No document found with that ID", 404);
        }

        return doc;
    }

    async delete(id: string): Promise<T | null> {
        const doc = await this.repo.delete(id);

        if (!doc) {
            throw new AppError("No document found with that ID", 404);
        }

        return doc;
    }
}


export default CrudService;