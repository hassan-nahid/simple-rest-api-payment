"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductZodSchema = exports.createProductZodSchema = void 0;
const zod_1 = require("zod");
exports.createProductZodSchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: "Product name must be a string" })
        .min(2, { message: "Product name must be at least 2 characters long" })
        .max(100, { message: "Product name cannot exceed 100 characters" })
        .trim(),
    description: zod_1.z
        .string({ message: "Description must be a string" })
        .min(10, { message: "Description must be at least 10 characters long" })
        .max(1000, { message: "Description cannot exceed 1000 characters" })
        .trim(),
    price: zod_1.z
        .number({ message: "Price must be a number" })
        .positive({ message: "Price must be a positive number" })
        .min(0.01, { message: "Price must be at least 0.01" }),
    quantity: zod_1.z
        .number({ message: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .min(0, { message: "Quantity cannot be negative" }),
    image: zod_1.z
        .string({ message: "Image URL must be a string" })
        .url({ message: "Image must be a valid URL" })
        .optional(),
    isActive: zod_1.z
        .boolean({ message: "isActive must be a boolean" })
        .optional(),
});
exports.updateProductZodSchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: "Product name must be a string" })
        .min(2, { message: "Product name must be at least 2 characters long" })
        .max(100, { message: "Product name cannot exceed 100 characters" })
        .trim()
        .optional(),
    description: zod_1.z
        .string({ message: "Description must be a string" })
        .min(10, { message: "Description must be at least 10 characters long" })
        .max(1000, { message: "Description cannot exceed 1000 characters" })
        .trim()
        .optional(),
    price: zod_1.z
        .number({ message: "Price must be a number" })
        .positive({ message: "Price must be a positive number" })
        .min(0.01, { message: "Price must be at least 0.01" })
        .optional(),
    quantity: zod_1.z
        .number({ message: "Quantity must be a number" })
        .int({ message: "Quantity must be an integer" })
        .min(0, { message: "Quantity cannot be negative" })
        .optional(),
    image: zod_1.z
        .string({ message: "Image URL must be a string" })
        .url({ message: "Image must be a valid URL" })
        .optional(),
    isActive: zod_1.z
        .boolean({ message: "isActive must be a boolean" })
        .optional(),
});
