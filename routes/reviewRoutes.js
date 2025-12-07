const express = require('express');
const reviewController = require("../controllers/reviewController");
const authContoller = require("../controllers/authController");


const router = express.Router({ mergeParams: true });

// protected routes
router.use(authContoller.protect);


router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(authContoller.restrictTo("user"), reviewController.setTourUserIds, reviewController.validateTourId, reviewController.createReview);
router.route("/:id")
    .get(reviewController.getReview)
    .patch(authContoller.restrictTo("user", "admin"), reviewController.updateReview)
    .delete(authContoller.restrictTo("user", "admin"), reviewController.deleteReview);

module.exports = router;