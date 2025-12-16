import { Router } from 'express';
import { getCheckoutSession, getAllBookings, createBookings, getOneBookings, updateBookings, deleteBookings } from '../controllers/bookingController.ts';
import { protect, restrictTo } from '../controllers/authController.ts';

const router = Router();

// protected routes
router.use(protect);



router.get("/checkout-session/:tourId",
    getCheckoutSession);

router.use(restrictTo("admin", "lead-guide"));

router.route("/")
    .get(getAllBookings)
    .post(createBookings);


router.route("/:id").
    get(getOneBookings)
    .patch(updateBookings)
    .delete(deleteBookings);

export default router;
