// src/services/cacheService.ts
import { Redis } from 'ioredis';

export class CacheService {
    private client: Redis;

    private readonly DEFAULT_TTL = 3600; // 1 hour

    constructor() {
        this.client = new Redis({
            username: process.env.REDIS_USERNAME,
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });

        this.client.on('connect', () => {
            console.log('Connected to Redis');
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
        try {
            const serializedValue = JSON.stringify(value);

            await this.client.set(key, serializedValue, 'EX', ttl);
            return true;

        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            console.error('Cache del error:', error);
            return false;
        }

    }

    async delPattern(pattern: string): Promise<boolean> {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
            return true;
        } catch (error) {
            console.error('Cache del pattern error:', error);
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            console.error('Cache exists error:', error);
            return false;
        }


    }

    async disconnect(): Promise<void> {
        await this.client.quit();
    }
}

const cacheService = new CacheService();

export default cacheService;