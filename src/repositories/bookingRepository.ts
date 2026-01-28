import Booking, { BookingDocument } from "../models/booking.model.js";
import BaseRepository from "./BaseRepository.js";

class BookingRepository extends BaseRepository<BookingDocument> {
    constructor() {
        super(Booking);
    }
}


export default BookingRepository;


