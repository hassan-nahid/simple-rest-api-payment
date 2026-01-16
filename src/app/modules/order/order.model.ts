import { model, Schema } from "mongoose";
import { IOrder, IOrderItem, OrderStatus, PaymentMethod, PaymentStatus } from "./order.interface";

const orderItemSchema = new Schema<IOrderItem>({
    product: {
        type: Schema.Types.ObjectId,
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

const orderSchema = new Schema<IOrder>({
    user: {
        type: Schema.Types.ObjectId,
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
            validator: (items: IOrderItem[]) => items.length > 0,
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
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING
    },
    paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PaymentMethod),
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

export const Order = model<IOrder>("Order", orderSchema);
