import type { Query } from "mongoose";

export default class APIFeatures<T> {
    query: Query<T[], T>;

    private queryString: Record<string, string>;

    constructor(query: Query<T[], T>, queryString: Record<string, string>) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // build the query obj 
        const queryObj = { ...this.queryString };
        const excludedFields = ["limit", "page", "sort", "fields"];
        excludedFields.forEach(el => delete queryObj[el]);
        // Transforms operators like gte, lte into MongoDB syntax($gte, $lte).
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);
        // apply the filter
        this.query.find(JSON.parse(queryStr));
        // return the obj  for chainging
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query.sort(sortBy);
        } else {
            this.query.sort("-createdAt");
        }
        return this;
    }

    limitFields() { // Projection
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query.select(fields);
        } else {
            this.query.select("-__v");
        }
        return this;

    }

    paginate() {
        const page = Number(this.queryString.page ?? 1);
        const limit = Number(this.queryString.limit ?? 100);
        const skip = (page - 1) * limit;
        this.query.skip(skip).limit(limit);
        return this;
    }
}