/* eslint-disable no-console */
import { createClient } from 'redis';
import { envVars } from './env';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
};

export const redisClient = createClient({
    username: envVars.REDIS_USERNAME,
    password: envVars.REDIS_PASSWORD,
    socket: {
        host: envVars.REDIS_HOST,
        port: Number(envVars.REDIS_PORT),
    }
});

redisClient.on('error', err => console.log(`${colors.red}${colors.bright}❌ Redis Client Error:${colors.reset}`, err));


export const connectRedis = async () => {
    if(!redisClient.isOpen){
        await redisClient.connect();
        console.log(`${colors.green}${colors.bright}⚡ Redis Connected Successfully!${colors.reset}`)
    }
}