import { Types } from "mongoose";

export enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}

export enum PaymentStatus {
    PENDING = "PENDING",
    PAID = "PAID",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}

export enum PaymentMethod {
    STRIPE = "STRIPE",
    CARD = "CARD",
    CASH = "CASH"
}

export interface IOrderItem {
    product: Types.ObjectId;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
}

export interface IOrder {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    orderNumber: string;
    items: IOrderItem[];
    totalAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    paymentIntentId?: string;
    stripeSessionId?: string;
    customerEmail?: string;
    customerName?: string;
    shippingAddress?: string;
    notes?: string;
    paidAt?: Date;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
