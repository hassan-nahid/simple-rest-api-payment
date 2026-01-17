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
        message: result.checkoutUrl
            ? "Order created successfully. Redirecting to payment..."
            : "Order created successfully",
        data: {
            order: result.order,
            checkoutUrl: result.checkoutUrl // Frontend will auto redirect to this URL
        }
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
const paymentSuccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { sessionId, orderId } = req.query;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                }
                .success-icon {
                    color: #10b981;
                    font-size: 72px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 10px;
                }
                p {
                    color: #6b7280;
                    line-height: 1.6;
                }
                .order-id {
                    background: #f3f4f6;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✓</div>
                <h1>Payment Successful!</h1>
                <p>Your payment has been processed successfully.</p>
                <div class="order-id">
                    <strong>Order ID:</strong> ${orderId}<br>
                    <strong>Session ID:</strong> ${sessionId}
                </div>
                <p>Your order status will be updated shortly. Thank you for your purchase!</p>
            </div>
        </body>
        </html>
    `);
});
const paymentCancelled = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.query;
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Cancelled</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                }
                .cancel-icon {
                    color: #ef4444;
                    font-size: 72px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 10px;
                }
                p {
                    color: #6b7280;
                    line-height: 1.6;
                }
                .order-id {
                    background: #f3f4f6;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="cancel-icon">✕</div>
                <h1>Payment Cancelled</h1>
                <p>Your payment has been cancelled. No charges were made.</p>
                <div class="order-id">
                    <strong>Order ID:</strong> ${orderId}
                </div>
                <p>You can try again anytime. Your order is still saved.</p>
            </div>
        </body>
        </html>
    `);
});
exports.OrderControllers = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    getPaymentIntentSecret,
    cancelOrder,
    handleStripeWebhook,
    paymentSuccess,
    paymentCancelled
};
