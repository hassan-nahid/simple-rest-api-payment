"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = exports.redisClient = void 0;
/* eslint-disable no-console */
const redis_1 = require("redis");
const env_1 = require("./env");
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
};
exports.redisClient = (0, redis_1.createClient)({
    username: env_1.envVars.REDIS_USERNAME,
    password: env_1.envVars.REDIS_PASSWORD,
    socket: {
        host: env_1.envVars.REDIS_HOST,
        port: Number(env_1.envVars.REDIS_PORT),
    }
});
exports.redisClient.on('error', err => console.log(`${colors.red}${colors.bright}❌ Redis Client Error:${colors.reset}`, err));
const connectRedis = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!exports.redisClient.isOpen) {
        yield exports.redisClient.connect();
        console.log(`${colors.green}${colors.bright}⚡ Redis Connected Successfully!${colors.reset}`);
    }
});
exports.connectRedis = connectRedis;
