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
exports.OrderControllers = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const stripe_config_1 = require("../../config/stripe.config");
const CatchAsync_1 = require("../../utils/CatchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const order_service_1 = require("./order.service");
const env_1 = require("../../config/env");
const createOrder = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderServices.createOrder(req.body, user);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.CREATED,
        message: "Order created successfully",
        data: result
    });
}));
const getAllOrders = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderServices.getAllOrders(req.query, user);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Orders retrieved successfully",
        data: result.result,
        meta: result.meta
    });
}));
const getSingleOrder = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderServices.getSingleOrder(req.params.id, user);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Order retrieved successfully",
        data: result
    });
}));
const updateOrderStatus = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield order_service_1.OrderServices.updateOrderStatus(req.params.id, req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Order status updated successfully",
        data: result
    });
}));
const getPaymentIntentSecret = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderServices.getPaymentIntentSecret(req.params.id, user);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Payment intent retrieved successfully",
        data: result
    });
}));
const cancelOrder = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield order_service_1.OrderServices.cancelOrder(req.params.id, user);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Order cancelled successfully",
        data: result
    });
}));
// Stripe webhook handler
const handleStripeWebhook = (0, CatchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        // If webhook secret is configured, verify the signature
        if (env_1.envVars.STRIPE_WEBHOOK_SECRET) {
            event = stripe_config_1.stripe.webhooks.constructEvent(req.body, sig, env_1.envVars.STRIPE_WEBHOOK_SECRET);
        }
        else {
            // For development without webhook secret
            event = JSON.parse(req.body.toString());
        }
        yield order_service_1.OrderServices.handleStripeWebhook(event);
        res.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
}));
exports.OrderControllers = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    getPaymentIntentSecret,
    cancelOrder,
    handleStripeWebhook
};
