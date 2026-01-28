import { Request, Response, NextFunction } from 'express';
import cacheService from '../services/cacheService.js';

interface CacheOptions {
    ttl?: number;
    keyPrefix?: string;
    excludeQuery?: string[];
}

const cacheMiddleware = (options: CacheOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        try {
            // Generate cache key
            const keyPrefix = options.keyPrefix || 'api';
            const queryParams = { ...req.query };

            // Remove excluded query parameters
            if (options.excludeQuery) {
                options.excludeQuery.forEach(key => delete queryParams[key]);
            }

            const queryString = Object.keys(queryParams).length
                ? `?${new URLSearchParams(queryParams as any).toString()}`
                : '';

            const cacheKey = `${keyPrefix}:${req.path}${queryString}`;

            // Try to get cached data
            const cachedData = await cacheService.get(cacheKey);

            if (cachedData) {
                console.log(`Cache HIT: ${cacheKey}`);
                return res.status(200).json(cachedData);
            }

            console.log(`Cache MISS: ${cacheKey}`);

            // Store original json function
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function (data: any) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheService.set(cacheKey, data, options.ttl).catch(err => {
                        console.error('Failed to cache response:', err);
                    });
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

export default cacheMiddleware;