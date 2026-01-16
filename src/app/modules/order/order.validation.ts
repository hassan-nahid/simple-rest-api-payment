import { z } from "zod";
import { OrderStatus, PaymentMethod, PaymentStatus } from "./order.interface";

export const orderItemSchema = z.object({
    product: z.string({ message: "Product ID must be a string" }),
    quantity: z.number({ message: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .min(1, { message: "Quantity must be at least 1" })
});

export const createOrderZodSchema = z.object({
    items: z.array(orderItemSchema)
        .min(1, { message: "Order must have at least one item" }),
    paymentMethod: z.nativeEnum(PaymentMethod, {
        message: "Invalid payment method. Use STRIPE, CARD, or CASH"
    }),
    customerEmail: z.string().email().optional(),
    customerName: z.string().min(2).max(100).trim().optional(),
    shippingAddress: z.string().max(500).trim().optional(),
    notes: z.string().max(1000).trim().optional()
});

export const updateOrderStatusZodSchema = z.object({
    orderStatus: z.nativeEnum(OrderStatus, {
        message: "Invalid order status"
    }).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus, {
        message: "Invalid payment status"
    }).optional(),
    notes: z.string().max(1000).trim().optional()
});
