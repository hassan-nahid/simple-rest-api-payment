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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./app/config/env");
const seedSuperAdmin_1 = require("./app/utils/seedSuperAdmin");
const redis_config_1 = require("./app/config/redis.config");
// ANSI Color Codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    // Foreground colors
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    // Background colors
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
};
const log = {
    success: (msg) => console.log(`${colors.green}${colors.bright}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}${colors.bright}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}${colors.bright}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}${colors.bright}ℹ️  ${msg}${colors.reset}`),
    server: (msg) => console.log(`${colors.magenta}${colors.bright}🚀 ${msg}${colors.reset}`),
    db: (msg) => console.log(`${colors.green}${colors.bright}💾 ${msg}${colors.reset}`),
    redis: (msg) => console.log(`${colors.red}${colors.bright}⚡ ${msg}${colors.reset}`),
    shutdown: (msg) => console.log(`${colors.yellow}${colors.bright}🛑 ${msg}${colors.reset}`),
    fatal: (msg, error) => {
        console.log(`${colors.bgRed}${colors.white}${colors.bright} 💀 FATAL ERROR 💀 ${colors.reset}`);
        console.log(`${colors.red}${colors.bright}${msg}${colors.reset}`);
        if (error)
            console.log(error);
    }
};
const banner = () => {
    var _a;
    console.log(`
${colors.cyan}${colors.bright}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ${colors.magenta}🔥  SIMPLE REST PAYMENT API  🔥${colors.cyan}                   ║
║                                                           ║
║     ${colors.white}Environment: ${colors.yellow}${((_a = env_1.envVars.NODE_ENV) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || 'DEVELOPMENT'}${colors.cyan}                          ║
║     ${colors.white}Port:        ${colors.green}${env_1.envVars.PORT}${colors.cyan}                                     ║
║     ${colors.white}MongoDB:     ${colors.blue}Connected${colors.cyan}                                ║
║     ${colors.white}Redis:       ${colors.red}Connected${colors.cyan}                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
    `);
};
let server;
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(env_1.envVars.DB_URL);
        log.db(`MongoDB Connected Successfully!`);
        server = app_1.default.listen(env_1.envVars.PORT, () => {
            banner();
            log.server(`Server is running on http://localhost:${env_1.envVars.PORT}`);
            log.info(`API Base URL: http://localhost:${env_1.envVars.PORT}/api/v1`);
            log.success(`Ready to accept connections!`);
        });
    }
    catch (error) {
        log.fatal("Failed to start server", error);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, redis_config_1.connectRedis)();
    yield startServer();
    yield (0, seedSuperAdmin_1.seedSuperAdmin)();
}))();
process.on("SIGTERM", () => {
    log.shutdown("SIGTERM signal received... Gracefully shutting down server...");
    if (server) {
        server.close(() => {
            log.warning("Server closed. Exiting process.");
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on("SIGINT", () => {
    log.shutdown("SIGINT signal received... Gracefully shutting down server...");
    if (server) {
        server.close(() => {
            log.warning("Server closed. Exiting process.");
            process.exit(0);
        });
    }
    else {
        process.exit(0);
    }
});
process.on("unhandledRejection", (error) => {
    log.fatal("Unhandled Promise Rejection detected!", error);
    if (server) {
        server.close(() => {
            log.error("Server closed due to unhandled rejection.");
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
process.on("uncaughtException", (error) => {
    log.fatal("Uncaught Exception detected!", error);
    if (server) {
        server.close(() => {
            log.error("Server closed due to uncaught exception.");
            process.exit(1);
        });
    }
    else {
        process.exit(1);
    }
});
