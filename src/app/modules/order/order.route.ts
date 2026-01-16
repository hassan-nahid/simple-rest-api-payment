import { Router } from "express";
import { checkAuth } from "../../middleware/CheckAuth";
import { validateRequest } from "../../middleware/ValidateRequest";
import { Role } from "../user/user.interface";
import { OrderControllers } from "./order.controller";
import { createOrderZodSchema, updateOrderStatusZodSchema } from "./order.validation";
import express from "express";

const router = Router();

// Stripe webhook - Must be before express.json() middleware
router.post(
    "/webhook",
    express.raw({ type: 'application/json' }),
    OrderControllers.handleStripeWebhook
);

// Create order (authenticated users)
router.post(
    "/create",
    checkAuth(...Object.values(Role)),
    validateRequest(createOrderZodSchema),
    OrderControllers.createOrder
);

// Get all orders (users get their own, admins get all)
router.get(
    "/",
    checkAuth(...Object.values(Role)),
    OrderControllers.getAllOrders
);

// Get single order
router.get(
    "/:id",
    checkAuth(...Object.values(Role)),
    OrderControllers.getSingleOrder
);

// Get payment intent secret for an order
router.get(
    "/:id/payment-secret",
    checkAuth(...Object.values(Role)),
    OrderControllers.getPaymentIntentSecret
);

// Update order status (admin only)
router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateOrderStatusZodSchema),
    OrderControllers.updateOrderStatus
);

// Cancel order
router.patch(
    "/:id/cancel",
    checkAuth(...Object.values(Role)),
    OrderControllers.cancelOrder
);

export const OrderRoutes = router;
