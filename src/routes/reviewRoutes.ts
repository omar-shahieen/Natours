import { Router } from 'express';
import { getAllReviews, setTourUserIds, validateTourId, createReview, getReview, updateReview, deleteReview } from "../controllers/reviewController.ts";
import { protect, restrictTo } from "../controllers/authController.ts";


const router = Router({ mergeParams: true });

// protected routes
router.use(protect);


router
    .route("/")
    .get(getAllReviews)
    .post(restrictTo("user"), setTourUserIds, validateTourId, createReview);
router.route("/:id")
    .get(getReview)
    .patch(restrictTo("user", "admin"), updateReview)
    .delete(restrictTo("user", "admin"), deleteReview);

export default router;