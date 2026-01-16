import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { stripe } from "../../config/stripe.config";
import { catchAsync } from "../../utils/CatchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { OrderServices } from "./order.service";
import { envVars } from "../../config/env";
import Stripe from "stripe";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await OrderServices.createOrder(req.body, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Order created successfully",
        data: result
    });
});

const getAllOrders = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await OrderServices.getAllOrders(req.query, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Orders retrieved successfully",
        data: result.result,
        meta: result.meta
    });
});

const getSingleOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await OrderServices.getSingleOrder(req.params.id as string, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order retrieved successfully",
        data: result
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderServices.updateOrderStatus(req.params.id as string, req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order status updated successfully",
        data: result
    });
});

const getPaymentIntentSecret = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await OrderServices.getPaymentIntentSecret(req.params.id as string, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Payment intent retrieved successfully",
        data: result
    });
});

const cancelOrder = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const result = await OrderServices.cancelOrder(req.params.id as string, user);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Order cancelled successfully",
        data: result
    });
});

// Stripe webhook handler
const handleStripeWebhook = catchAsync(async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
        // If webhook secret is configured, verify the signature
        if (envVars.STRIPE_WEBHOOK_SECRET) {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                envVars.STRIPE_WEBHOOK_SECRET
            );
        } else {
            // For development without webhook secret
            event = JSON.parse(req.body.toString());
        }

        await OrderServices.handleStripeWebhook(event);

        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

export const OrderControllers = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    getPaymentIntentSecret,
    cancelOrder,
    handleStripeWebhook
};
