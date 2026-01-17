import { Router } from "express";
import { checkAuth } from "../../middleware/CheckAuth";
import { validateRequest } from "../../middleware/ValidateRequest";
import { Role } from "../user/user.interface";
import { OrderControllers } from "./order.controller";
import { createOrderZodSchema, updateOrderStatusZodSchema } from "./order.validation";

const router = Router();

router.get("/payment-success", OrderControllers.paymentSuccess);
router.get("/payment-cancelled", OrderControllers.paymentCancelled);

router.post(
    "/create",
    checkAuth(...Object.values(Role)),
    validateRequest(createOrderZodSchema),
    OrderControllers.createOrder
);

router.get(
    "/",
    checkAuth(...Object.values(Role)),
    OrderControllers.getAllOrders
);

router.get(
    "/:id",
    checkAuth(...Object.values(Role)),
    OrderControllers.getSingleOrder
);

router.get(
    "/:id/payment-secret",
    checkAuth(...Object.values(Role)),
    OrderControllers.getPaymentIntentSecret
);

router.patch(
    "/:id/status",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateOrderStatusZodSchema),
    OrderControllers.updateOrderStatus
);

router.patch(
    "/:id/cancel",
    checkAuth(...Object.values(Role)),
    OrderControllers.cancelOrder
);

export const OrderRoutes = router;
