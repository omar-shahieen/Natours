import { Router } from 'express';
import { aliasTopTours, getAllTours, getTourStats, getMonthlyPlan, getTourWithIn, getDistances, createTour, getTour, uploadTourImages, resizeTourImages, updateTour, deleteTour, validateLatLng } from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import reviewRouter from "./reviewRoutes.js";
import cacheMiddleware from '../middleware/cacheMiddleware.js';

const router = Router();


router
  .route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);

router
  .route('/tour-stats')
  .get(
    cacheMiddleware({ ttl: 3600, keyPrefix: 'tour' }),
    getTourStats);


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

  .get(
    cacheMiddleware({ ttl: 300, keyPrefix: 'api' }),
    getAllTours)

  .post(
    protect,
    restrictTo("admin", "lead-guide"),
    createTour);


router
  .route('/:id')
  .get(
    cacheMiddleware({ ttl: 1800, keyPrefix: 'tour' }),
    getTour)

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
