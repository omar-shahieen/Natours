import type { Request, NextFunction, Response } from 'express';
import multer, { memoryStorage, type FileFilterCallback } from 'multer';
import sharp from 'sharp';

import Tour from '../models/Tour.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from "./handlerFactory.js";

// Helper to convert distance to radians
function toRadian(distance: number, unit: "mi" | "km") {
  return unit === "mi" ? distance / 3963.2 : distance / 6378.1;
}


// Alias middleware
export function aliasTopTours(req: Request, res: Response, next: NextFunction) {
  req.url = req.url.replace(
    "/top-5-cheap",
    "?sort=ratingAverage,price&limit=5&fields=name,price,ratingAverage,summary,difficulty"
  );
  next();
}

// ----------------- MULTER -----------------
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
export const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

interface TourFiles {
  imageCover?: Express.Multer.File[];
  images?: Express.Multer.File[];
}


export const resizeTourImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

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

export const getAllTours = getAll(Tour);

export const getTour = getOne(Tour);

export const createTour = createOne(Tour);

export const updateTour = updateOne(Tour);

export const deleteTour = deleteOne(Tour);

export const getTourStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

export const getMonthlyPlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const year = Number(req.params.year);

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    }
  });

});


export const validateLatLng = (req: Request, res: Response, next: NextFunction) => {

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


  req.body.coordinates = { lat, lng };

  next();
};


// Typed interfaces for params
interface TourWithinParams {
  distance: string;  // will parse to number
  unit: "mi" | "km";
}

interface DistancesParams {
  unit: "mi" | "km";
}
export const getTourWithIn = catchAsync(
  async (req: Request<TourWithinParams>, res: Response, next: NextFunction) => {
    const { distance, unit } = req.params;
    const { lng, lat } = req.body.coordinates;


    const radius = toRadian(parseFloat(distance), unit);

    const tours = await Tour.find({
      startLocation: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radius],
        }
      }
    });
    res.status(200).json({
      status: "success",
      data: {
        data: tours
      }
    });

  });

export const getDistances = catchAsync(
  async (req: Request<DistancesParams>, res: Response, next: NextFunction) => {
    const { unit } = req.params;
    const { lng, lat } = req.body.coordinates;

    const multiplier = unit === "mi" ? 0.00062137 : 0.001;

    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng * 1, lat * 1]
          },
          distanceField: "distance",
          distanceMultiplier: multiplier
        }
      }, {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ]);
    res.status(200).json({
      status: "success",
      data: {
        data: distances
      }
    });

  });