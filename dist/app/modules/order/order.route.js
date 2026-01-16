"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRoutes = void 0;
const express_1 = require("express");
const CheckAuth_1 = require("../../middleware/CheckAuth");
const ValidateRequest_1 = require("../../middleware/ValidateRequest");
const user_interface_1 = require("../user/user.interface");
const order_controller_1 = require("./order.controller");
const order_validation_1 = require("./order.validation");
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
// Stripe webhook - Must be before express.json() middleware
router.post("/webhook", express_2.default.raw({ type: 'application/json' }), order_controller_1.OrderControllers.handleStripeWebhook);
// Create order (authenticated users)
router.post("/create", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), (0, ValidateRequest_1.validateRequest)(order_validation_1.createOrderZodSchema), order_controller_1.OrderControllers.createOrder);
// Get all orders (users get their own, admins get all)
router.get("/", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), order_controller_1.OrderControllers.getAllOrders);
// Get single order
router.get("/:id", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), order_controller_1.OrderControllers.getSingleOrder);
// Get payment intent secret for an order
router.get("/:id/payment-secret", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), order_controller_1.OrderControllers.getPaymentIntentSecret);
// Update order status (admin only)
router.patch("/:id/status", (0, CheckAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, ValidateRequest_1.validateRequest)(order_validation_1.updateOrderStatusZodSchema), order_controller_1.OrderControllers.updateOrderStatus);
// Cancel order
router.patch("/:id/cancel", (0, CheckAuth_1.checkAuth)(...Object.values(user_interface_1.Role)), order_controller_1.OrderControllers.cancelOrder);
exports.OrderRoutes = router;
