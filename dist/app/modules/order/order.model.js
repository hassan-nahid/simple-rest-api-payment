"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const order_interface_1 = require("./order.interface");
const orderItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: "Order must have at least one item"
        }
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    orderStatus: {
        type: String,
        enum: Object.values(order_interface_1.OrderStatus),
        default: order_interface_1.OrderStatus.PENDING
    },
    paymentStatus: {
        type: String,
        enum: Object.values(order_interface_1.PaymentStatus),
        default: order_interface_1.PaymentStatus.PENDING
    },
    paymentMethod: {
        type: String,
        enum: Object.values(order_interface_1.PaymentMethod),
        required: true
    },
    paymentIntentId: {
        type: String,
        trim: true
    },
    stripeSessionId: {
        type: String,
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true
    },
    customerName: {
        type: String,
        trim: true
    },
    shippingAddress: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    paidAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Index for faster queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ stripeSessionId: 1 });
exports.Order = (0, mongoose_1.model)("Order", orderSchema);
