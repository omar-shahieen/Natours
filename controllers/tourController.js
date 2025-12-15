import multer, { memoryStorage } from 'multer';
import sharp from 'sharp';

import catchAsync from '../utils/catchAsync.js';
import Tour from '../models/Tour.js';
import { getAll, getOne, createOne, updateOne, deleteOne } from "./handlerFactory.js";
import AppError from '../utils/AppError.js';

function toRadian(distance, unit) {
  return unit === "mi" ? distance / 3963.2 : distance / 6378.1;
}
export function aliasTopTours(req, res, next) {
  req.url = req.url.replace("/top-5-cheap",
    "?sort=ratingAverage,price&limit=5&fields=name,price,ratingAverage,summary,difficulty")
  next();
}
// upload images 
const multerStorage = memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true)
  } else {
    cb(new AppError("Please upload only images!", 400), false)
  }
}
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

export const uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

export const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) next();

  // cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);


  //  images

  req.body.images = [];
  const imgPromisies = req.files.images.map(async (file, i) => {
    const fileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${fileName}`);
    req.body.images.push(fileName);

  })
  await Promise.all(imgPromisies);

  next();
});
export const getAllTours = getAll(Tour);

export const getTour = getOne(Tour);

export const createTour = createOne(Tour);

export const updateTour = updateOne(Tour);

export const deleteTour = deleteOne(Tour);

export const getTourStats = catchAsync(async (req, res, next) => {

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

export const getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });

});
export const getTourWithIn = catchAsync(
  async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");
    if (!lat || !lng)
      return next(new AppError("please provide the tour longtitude and lattiude in the format lat,lng", 400));
    const radius = toRadian(distance, unit);

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
    })
  });
export const getDistances = catchAsync(
  async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");


    const multiplier = unit === "mi" ? 0.00062137 : 0.001;

    if (!lat || !lng)
      return next(new AppError("please provide the tour longtitude and lattiude in the format lat,lng", 400));

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
    })
  });