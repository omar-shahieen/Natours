import { Router } from 'express';
import { getOverview, getTour, getLoginForm, getMe, getMyTours } from "../controllers/viewController.js"
import { createBookingCheckout } from "../controllers/bookingController.js"
import { isLoggedIn, protect } from "../controllers/authController.js"

const router = Router();


router.get("/",
    createBookingCheckout,
    isLoggedIn, getOverview);
router.get("/tour/:slug", isLoggedIn, getTour);
router.get("/login", isLoggedIn, getLoginForm);
router.get("/me", protect, getMe);
router.get("/my-tours", protect, getMyTours);
// router.get("/signup", viewController.signup);

export default router;
