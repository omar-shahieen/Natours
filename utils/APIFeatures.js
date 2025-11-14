module.exports = class APIFeatures {
    constructor(query, queryString) {
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
        this.query = this.query.find(JSON.parse(queryStr));
        // return the obj  for chainging
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.query.sort(sortBy)
        } else {
            this.query.sort("-createdAt")
        }
        return this;
    }

    limitFields() { // Projection
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(",").join(" ");
            this.query.select(fields)
        } else {
            this.query.select("-__v");
        }
        return this;

    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query.skip(skip).limit(limit);
        return this;
    }
}