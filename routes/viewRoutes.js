const express = require('express');
const viewController = require("../controllers/viewController");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();


router.get("/",
    bookingController.createBookingCheckout,
    authController.isLoggedIn, viewController.getOverview);
router.get("/tour/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/me", authController.protect, viewController.getMe);
router.get("/my-tours", authController.protect, viewController.getMyTours);
// router.get("/signup", viewController.signup);

module.exports = router;
