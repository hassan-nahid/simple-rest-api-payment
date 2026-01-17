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
        message: result.checkoutUrl 
            ? "Order created successfully. Redirecting to payment..." 
            : "Order created successfully",
        data: {
            order: result.order,
            checkoutUrl: result.checkoutUrl // Frontend will auto redirect to this URL
        }
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

const paymentSuccess = async (req: Request, res: Response) => {
    const { sessionId, orderId } = req.query;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Successful</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                }
                .success-icon {
                    color: #10b981;
                    font-size: 72px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 10px;
                }
                p {
                    color: #6b7280;
                    line-height: 1.6;
                }
                .order-id {
                    background: #f3f4f6;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✓</div>
                <h1>Payment Successful!</h1>
                <p>Your payment has been processed successfully.</p>
                <div class="order-id">
                    <strong>Order ID:</strong> ${orderId}<br>
                    <strong>Session ID:</strong> ${sessionId}
                </div>
                <p>Your order status will be updated shortly. Thank you for your purchase!</p>
            </div>
        </body>
        </html>
    `);
};

const paymentCancelled = async (req: Request, res: Response) => {
    const { orderId } = req.query;
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Cancelled</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 500px;
                }
                .cancel-icon {
                    color: #ef4444;
                    font-size: 72px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #1f2937;
                    margin-bottom: 10px;
                }
                p {
                    color: #6b7280;
                    line-height: 1.6;
                }
                .order-id {
                    background: #f3f4f6;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-family: monospace;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="cancel-icon">✕</div>
                <h1>Payment Cancelled</h1>
                <p>Your payment has been cancelled. No charges were made.</p>
                <div class="order-id">
                    <strong>Order ID:</strong> ${orderId}
                </div>
                <p>You can try again anytime. Your order is still saved.</p>
            </div>
        </body>
        </html>
    `);
};

export const OrderControllers = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    getPaymentIntentSecret,
    cancelOrder,
    handleStripeWebhook,
    paymentSuccess,
    paymentCancelled
};
