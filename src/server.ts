/* eslint-disable no-console */
import { Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import { envVars } from './app/config/env';
import { seedSuperAdmin } from './app/utils/seedSuperAdmin';

import { connectRedis } from './app/config/redis.config';

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
    success: (msg: string) => console.log(`${colors.green}${colors.bright}✅ ${msg}${colors.reset}`),
    error: (msg: string) => console.log(`${colors.red}${colors.bright}❌ ${msg}${colors.reset}`),
    warning: (msg: string) => console.log(`${colors.yellow}${colors.bright}⚠️  ${msg}${colors.reset}`),
    info: (msg: string) => console.log(`${colors.cyan}${colors.bright}ℹ️  ${msg}${colors.reset}`),
    server: (msg: string) => console.log(`${colors.magenta}${colors.bright}🚀 ${msg}${colors.reset}`),
    db: (msg: string) => console.log(`${colors.green}${colors.bright}💾 ${msg}${colors.reset}`),
    redis: (msg: string) => console.log(`${colors.red}${colors.bright}⚡ ${msg}${colors.reset}`),
    shutdown: (msg: string) => console.log(`${colors.yellow}${colors.bright}🛑 ${msg}${colors.reset}`),
    fatal: (msg: string, error?: unknown) => {
        console.log(`${colors.bgRed}${colors.white}${colors.bright} 💀 FATAL ERROR 💀 ${colors.reset}`);
        console.log(`${colors.red}${colors.bright}${msg}${colors.reset}`);
        if (error) console.log(error);
    }
};

const banner = () => {
    console.log(`
${colors.cyan}${colors.bright}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ${colors.magenta}🔥  SIMPLE REST PAYMENT API  🔥${colors.cyan}                   ║
║                                                           ║
║     ${colors.white}Environment: ${colors.yellow}${envVars.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}${colors.cyan}                          ║
║     ${colors.white}Port:        ${colors.green}${envVars.PORT}${colors.cyan}                                     ║
║     ${colors.white}MongoDB:     ${colors.blue}Connected${colors.cyan}                                ║
║     ${colors.white}Redis:       ${colors.red}Connected${colors.cyan}                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
    `);
};

let server: Server;


const startServer = async () => {
    try {

        await mongoose.connect(envVars.DB_URL)
        log.db(`MongoDB Connected Successfully!`)

        server = app.listen(envVars.PORT, () => {
            banner();
            log.server(`Server is running on http://localhost:${envVars.PORT}`);
            log.info(`API Base URL: http://localhost:${envVars.PORT}/api/v1`);
            log.success(`Ready to accept connections!`);
        })
    } catch (error) {
        log.fatal("Failed to start server", error);
    }
}

(async () => {
    await connectRedis()

    await startServer()
    await seedSuperAdmin()

})()

process.on("SIGTERM", () => {
    log.shutdown("SIGTERM signal received... Gracefully shutting down server...");
    if (server) {
        server.close(() => {
            log.warning("Server closed. Exiting process.");
            process.exit(0)
        });
    } else {
        process.exit(0)
    }
})

process.on("SIGINT", () => {
    log.shutdown("SIGINT signal received... Gracefully shutting down server...");
    if (server) {
        server.close(() => {
            log.warning("Server closed. Exiting process.");
            process.exit(0)
        });
    } else {
        process.exit(0)
    }
})

process.on("unhandledRejection", (error) => {
    log.fatal("Unhandled Promise Rejection detected!", error);
    if (server) {
        server.close(() => {
            log.error("Server closed due to unhandled rejection.");
            process.exit(1)
        });
    } else {
        process.exit(1)
    }
})

process.on("uncaughtException", (error) => {
    log.fatal("Uncaught Exception detected!", error);
    if (server) {
        server.close(() => {
            log.error("Server closed due to uncaught exception.");
            process.exit(1)
        });
    } else {
        process.exit(1)
    }
})