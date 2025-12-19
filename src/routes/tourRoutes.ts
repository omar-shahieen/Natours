import { Router } from 'express';
import { aliasTopTours, getAllTours, getTourStats, getMonthlyPlan, getTourWithIn, getDistances, createTour, getTour, uploadTourImages, resizeTourImages, updateTour, deleteTour, validateLatLng } from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import reviewRouter from "./reviewRoutes.js";

const router = Router();


router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);

router
  .route('/tour-stats')
  .get(getTourStats);


router
  .route('/monthly-plan/:year')
  .get(
    protect,
    restrictTo("admin", "lead-guide", "guide"),
    getMonthlyPlan);


router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(validateLatLng, getTourWithIn);


router
  .route("/distances/:latlng/unit/:unit")
  .get(validateLatLng, getDistances);


router
  .route('/')

  .get(getAllTours)

  .post(
    protect,
    restrictTo("admin", "lead-guide"),
    createTour);


router
  .route('/:id')
  .get(getTour)

  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour)

  .delete(
    protect,
    restrictTo("admin", "lead-guide"),
    deleteTour);

// reviews

router.use("/:tourId/reviews", reviewRouter);

export default router;
