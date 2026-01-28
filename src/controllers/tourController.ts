import type { Request, NextFunction, Response } from 'express';
import multer, { memoryStorage, type FileFilterCallback } from 'multer';
import sharp from 'sharp';
import { FilterQuery } from 'mongoose';
import Tour, { TourDocument } from '../models/tour.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import FactoryController from "./factoryController.js";
import TourService from '../services/tourService.js';



// Typed interfaces for params
interface TourWithinParams {
  distance: string;  // will parse to number
  unit: "mi" | "km";
}

interface DistancesParams {
  unit: "mi" | "km";
}

interface TourFiles {
  imageCover?: Express.Multer.File[];
  images?: Express.Multer.File[];
}












class TourController {

  private tourService: TourService;

  uploadTourImages!: ReturnType<multer.Multer['fields']>;

  constructor() {
    this.tourService = new TourService();

    const multerStorage = memoryStorage();

    //filter cb
    const multerFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
      if (file.mimetype.startsWith("image")) {
        cb(null, true);
      } else {
        cb(new AppError("Please upload only images!", 400));
      }
    };

    const upload = multer({
      storage: multerStorage,
      fileFilter: multerFilter,
    });

    // upload fileds
    this.uploadTourImages = upload.fields([
      { name: "imageCover", maxCount: 1 },
      { name: "images", maxCount: 3 },
    ]);

  }


  // ----------------- MULTER -----------------

  resizeTourImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const files = req.files as TourFiles;

    // If no files, skip
    if (!files || !files.imageCover || !files.imageCover[0] || !files.images) return next();

    // cover image
    const imageCoverFile = files.imageCover[0];
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(imageCoverFile.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);


    //  other images

    req.body.images = [];
    const imgPromisies = files.images.map(async (file, i) => {
      const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${fileName}`);
      req.body.images.push(fileName);

    });

    await Promise.all(imgPromisies);

    next();
  });

  // ----------------- CRUD HANDLERS -----------------

  getAllTours = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // to allow get review in nested tour route
    let actualFilter = {};
    if (req.params.tourId) {
      actualFilter = { ...actualFilter, tour: req.params.tourId } as FilterQuery<TourDocument>;
    }

    const tours = await this.tourService.getAllTours(actualFilter, req.query as Record<string, string>);

    res.status(200).json({
      status: 'success',
      length: tours.length,
      data: {
        data: tours,
      },
    });

  });

  getTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tour = await this.tourService.getTourById(req.params.id!);

    res.status(200).json({
      status: 'success',
      data: {
        data: tour,
      },
    });
  });


  createTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tour = await this.tourService.createTour(req.body);

    res.status(201).json({
      isSuccess: true,
      data: {
        data: tour,
      },
    });
  });


  updateTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const tour = await this.tourService.updateTour(req.params.id!, req.body);

    res.status(200).json({
      isSuccess: true,
      data: tour,
    });
  });

  deleteTour = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await this.tourService.deleteTour(req.params.id!);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });


  // Statistics


  getTourStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const stats = await this.tourService.getTourStats();



    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  });

  getMonthlyPlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const year = Number(req.params.year);

    const plan = await this.tourService.getMonthlyTourPlan(year);



    res.status(200).json({
      status: 'success',
      data: {
        plan,
      }
    });

  });

  // middlewares 
  aliasTopTours = (req: Request, res: Response, next: NextFunction) => {
    req.url = req.url.replace(
      "/top-5-cheap",
      "?sort=ratingAverage,price&limit=5&fields=name,price,ratingAverage,summary,difficulty"
    );
    next();
  };


  // geolocation

  getTourWithIn = catchAsync(
    async (req: Request<TourWithinParams>, res: Response, next: NextFunction) => {
      const { distance, unit } = req.params;
      const { lng, lat } = req.coordinates!;

      const tours = await this.tourService.getTourWithInRadius(lng, lat, distance, unit);

      res.status(200).json({
        status: "success",
        data: {
          data: tours
        }
      });

    });

  getDistances = catchAsync(
    async (req: Request<DistancesParams>, res: Response, next: NextFunction) => {
      const { unit } = req.params;
      const { lng, lat } = req.coordinates!;

      const distances = await this.tourService.getTourWithInDistance(lng, lat, unit);

      res.status(200).json({
        status: "success",
        data: {
          data: distances
        }
      });

    });


  validateLatLng = (req: Request, res: Response, next: NextFunction) => {

    const { latlng } = req.params;

    if (!latlng) return next(new AppError('No location provided', 400));


    const [latStr, lngStr] = latlng.split(",");
    if (!latStr || !lngStr) {
      return next(new AppError(
        "Please provide the tour longitude and latitude in the format lat,lng",
        400
      ));
    }
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (Number.isNaN(lat) || Number.isNaN(lng))
      return next(new AppError(
        "lat and lng must be numbers",
        400
      ));


    req.coordinates = { lat, lng };

    next();
  };

}

const tourController = new TourController();


export const {
  aliasTopTours,
  getAllTours,
  getTourStats,
  getMonthlyPlan,
  getTourWithIn,
  getDistances,
  createTour,
  getTour,
  uploadTourImages,
  resizeTourImages,
  updateTour,
  deleteTour,
  validateLatLng } = tourController;

export default tourController;