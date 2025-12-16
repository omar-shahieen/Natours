import { Router } from 'express';
import { aliasTopTours, getAllTours, getTourStats, getMonthlyPlan, getTourWithIn, getDistances, createTour, getTour, uploadTourImages, resizeTourImages, updateTour, deleteTour } from '../controllers/tourController.ts';
import { protect, restrictTo } from '../controllers/authController.ts';
import reviewRouter from "./reviewRoutes.ts";

const router = Router();


router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours)
router
  .route('/tour-stats')
  .get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    protect,
    restrictTo("admin", "guide-lead", "guide"),
    getMonthlyPlan);


router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getTourWithIn);
router
  .route("/distances/:latlng/unit/:unit")
  .get(getDistances);

router
  .route('/')
  .get(getAllTours)
  .post(
    protect,
    restrictTo("admin", "guide-lead"),
    createTour);

router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "guide-lead"),
    uploadTourImages,
    resizeTourImages,
    updateTour)
  .delete(
    protect,
    restrictTo("admin", "guide-lead"),
    deleteTour);

// reviews

router.use("/:tourId/reviews", reviewRouter);

export default router;
