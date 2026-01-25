
import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

const initializeRedisClient = async () => {
    if (!client) {
        client = createClient({
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT)
            }
        });

        client.on("error", (error) => {
            console.error(error);
        });


        client.on("connect", () => {
            console.log("Connected to Redis");
        });


        await client.connect();

    }

    return client;

};




export default initializeRedisClient;
