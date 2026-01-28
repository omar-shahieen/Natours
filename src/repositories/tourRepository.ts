import Tour, { TourDocument } from "../models/tour.model.js";
import BaseRepository from "./BaseRepository.js";

class TourRepository extends BaseRepository<TourDocument> {
    constructor() {
        super(Tour);
    }


    getHighRatedTourStats = async () => {

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

        return stats;

    };

    getMonthlyPlanForYear = async (year: number) => {

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


        return plan;
    };


    findToursNearLocation = async (lng: number, lat: number, radius: number) => {
        const tours = await Tour.find({
            startLocation: {
                $geoWithin: {
                    $centerSphere: [[lng, lat], radius],
                }
            }
        });

        return tours;

    };

    findTourDistanceFromPoint = async (lng: number, lat: number, multiplier: number) => {
        const distances = await Tour.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [lng, lat]
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

        return distances;
    };

}


export default TourRepository;
