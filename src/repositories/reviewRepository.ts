import Review, { ReviewDocument } from "../models/review.model.js";
import BaseRepository from "./BaseRepository.js";

class ReviewRepository extends BaseRepository<ReviewDocument> {
    constructor() {
        super(Review);
    }
}


export default ReviewRepository;


