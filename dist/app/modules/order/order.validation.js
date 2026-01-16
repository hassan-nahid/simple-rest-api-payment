"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusZodSchema = exports.createOrderZodSchema = exports.orderItemSchema = void 0;
const zod_1 = require("zod");
const order_interface_1 = require("./order.interface");
exports.orderItemSchema = zod_1.z.object({
    product: zod_1.z.string({ message: "Product ID must be a string" }),
    quantity: zod_1.z.number({ message: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .min(1, { message: "Quantity must be at least 1" })
});
exports.createOrderZodSchema = zod_1.z.object({
    items: zod_1.z.array(exports.orderItemSchema)
        .min(1, { message: "Order must have at least one item" }),
    paymentMethod: zod_1.z.nativeEnum(order_interface_1.PaymentMethod, {
        message: "Invalid payment method. Use STRIPE, CARD, or CASH"
    }),
    customerEmail: zod_1.z.string().email().optional(),
    customerName: zod_1.z.string().min(2).max(100).trim().optional(),
    shippingAddress: zod_1.z.string().max(500).trim().optional(),
    notes: zod_1.z.string().max(1000).trim().optional()
});
exports.updateOrderStatusZodSchema = zod_1.z.object({
    orderStatus: zod_1.z.nativeEnum(order_interface_1.OrderStatus, {
        message: "Invalid order status"
    }).optional(),
    paymentStatus: zod_1.z.nativeEnum(order_interface_1.PaymentStatus, {
        message: "Invalid payment status"
    }).optional(),
    notes: zod_1.z.string().max(1000).trim().optional()
});
