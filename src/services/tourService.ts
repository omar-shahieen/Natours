import { TourDocument } from "../models/tour.model.js";
import TourRepository from "../repositories/tourRepository.js";
import AppError from "../utils/AppError.js";
import cacheService from "./cacheService.js";


// Helper to convert distance to radians
function toRadian(distance: number, unit: "mi" | "km") {
    return unit === "mi" ? distance / 3963.2 : distance / 6378.1;
}

class TourService {
    private tourRepo: TourRepository;

    private readonly CACHE_PREFIX = 'tour';

    private readonly STATS_TTL = 3600; // 1 hour

    private readonly TOUR_TTL = 1800; // 30 minutes

    constructor() {
        this.tourRepo = new TourRepository();
    }

    getTourById = async (id: string) => {

        const chacheKey = `${this.CACHE_PREFIX}:${id}`;

        const cached = await cacheService.get(chacheKey);

        if (cached) return cached;


        const tour = await this.tourRepo.findById(id);

        if (!tour) {
            throw new AppError("No tour found with that ID", 404);
        }

        await cacheService.set(id, tour, this.TOUR_TTL);

        return tour;
    };


    getAllTours = async (query?: Record<string, string>, filter = {}): Promise<TourDocument[]> => {
        const docs = await this.tourRepo.findAll(filter, { queryParams: query });

        return docs;
    };

    createTour = async (data: TourDocument) => {
        const doc = await this.tourRepo.create(data);

        await this.invalidateTourCaches();

        return doc;

    };

    updateTour = async (id: string, data: TourDocument) => {
        const tour = await this.tourRepo.update(id, data);

        if (!tour) {
            throw new AppError("No tour found with that ID", 404);
        }
        // Invalidate specific tour cache
        const cacheKey = `${this.CACHE_PREFIX}:${id}`;
        // Invalidate list tour cache
        await cacheService.del(cacheKey);

        await this.invalidateTourCaches();

        return tour;
    };

    deleteTour = async (id: string) => {

        const tour = await this.tourRepo.delete(id);

        if (!tour) {
            throw new AppError("No tour found with that ID", 404);
        }

        await cacheService.del(`${this.CACHE_PREFIX}:${id}`);

        return tour;
    };

    private invalidateTourCaches = async () => {
        await cacheService.delPattern("api:/tours*");
        await cacheService.del(`${this.CACHE_PREFIX}:stats`);
    };

    getTourStats = async () => {
        const cacheKey = `${this.CACHE_PREFIX}:stats`;

        const cached = await cacheService.get(cacheKey);

        if (cached) return cached;

        const stats = await this.tourRepo.getHighRatedTourStats();

        if (stats) {
            await cacheService.set(cacheKey, stats, this.STATS_TTL);
        }

        return stats;
    };

    getMonthlyTourPlan = async (year: number) => {
        const plan = await this.tourRepo.getMonthlyPlanForYear(year);

        return plan;
    };


    getTourWithInRadius = async (lng: number, lat: number, distance: string, unit: string) => {
        if (unit !== "mi" && unit !== "km")
            throw new AppError("unit distance not is only km or mi", 400);


        const radius = toRadian(parseFloat(distance), unit);


        const tours = await this.tourRepo.findToursNearLocation(lng, lat, radius);


        return tours;

    };


    getTourWithInDistance = async (lng: number, lat: number, unit: string) => {
        if (unit !== "mi" && unit !== "km")
            throw new AppError("unit distance not is only km or mi", 400);

        const multiplier = unit === "mi" ? 0.00062137 : 0.001;

        const distances = await this.tourRepo.findTourDistanceFromPoint(lng * 1, lat * 1, multiplier);

        return distances;
    };


}

export default TourService;