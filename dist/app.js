"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./app/config/passport");
const env_1 = require("./app/config/env");
const routers_1 = require("./app/routers");
const globalErrorHandler_1 = require("./app/middleware/globalErrorHandler");
const notFound_1 = __importDefault(require("./app/middleware/notFound"));
const order_controller_1 = require("./app/modules/order/order.controller");
const app = (0, express_1.default)();
app.post('/api/v1/order/webhook', express_1.default.raw({ type: 'application/json' }), order_controller_1.OrderControllers.handleStripeWebhook);
app.use((0, express_session_1.default)({
    secret: env_1.envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use((0, cors_1.default)({
    origin: env_1.envVars.FRONTEND_URL,
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/api/v1", routers_1.router);
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Simple REST Payment API",
        version: "1.0.0",
        status: "operational",
        environment: env_1.envVars.NODE_ENV || "development",
        timestamp: new Date().toISOString()
    });
});
app.use(globalErrorHandler_1.globalErrorHandler);
app.use(notFound_1.default);
exports.default = app;
