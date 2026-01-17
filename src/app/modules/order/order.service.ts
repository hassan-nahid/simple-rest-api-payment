import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import Stripe from "stripe";
import { stripe } from "../../config/stripe.config";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Product } from "../product/product.model";
import { IOrder, IOrderItem, OrderStatus, PaymentMethod, PaymentStatus } from "./order.interface";
import { Order } from "./order.model";
import { envVars } from "../../config/env";

// Generate unique order number
const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
};

// Create order with Stripe payment intent
const createOrder = async (payload: Partial<IOrder>, user: JwtPayload) => {
    const { items, paymentMethod, customerEmail, customerName, shippingAddress, notes } = payload;

    if (!items || items.length === 0) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order must have at least one item");
    }

    // Validate products and calculate total
    const orderItems: IOrderItem[] = [];
    let totalAmount = 0;

    for (const item of items) {
        const product = await Product.findById(item.product);

        if (!product) {
            throw new AppError(httpStatus.NOT_FOUND, `Product with ID ${item.product} not found`);
        }

        if (product.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST, `Product ${product.name} is no longer available`);
        }

        if (!product.isActive) {
            throw new AppError(httpStatus.BAD_REQUEST, `Product ${product.name} is currently inactive`);
        }

        if (product.quantity < item.quantity) {
            throw new AppError(
                httpStatus.BAD_REQUEST,
                `Insufficient stock for ${product.name}. Available: ${product.quantity}`
            );
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItems.push({
            product: product._id!,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal
        });
    }

    const orderNumber = generateOrderNumber();

    // Create order object
    const orderData: Partial<IOrder> = {
        user: user.userId,
        orderNumber,
        items: orderItems,
        totalAmount,
        paymentMethod: paymentMethod || PaymentMethod.STRIPE,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        customerEmail: customerEmail || user.email,
        customerName: customerName || user.name,
        shippingAddress,
        notes
    };

    // Create Stripe Checkout Session if payment method is STRIPE
    let checkoutUrl: string | null = null;

    if (paymentMethod === PaymentMethod.STRIPE) {
        try {
            // Create order first to get order ID
            const tempOrder = await Order.create(orderData);

            // Create Stripe Checkout Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                line_items: orderItems.map(item => ({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.name,
                            description: `Quantity: ${item.quantity}`
                        },
                        unit_amount: Math.round(item.price * 100) // Convert to cents
                    },
                    quantity: item.quantity
                })),
                success_url: `${envVars.FRONTEND_URL}/payment-success?sessionId={CHECKOUT_SESSION_ID}&orderId=${tempOrder._id}`,
                cancel_url: `${envVars.FRONTEND_URL}/payment-cancelled?orderId=${tempOrder._id}`,
                metadata: {
                    orderNumber,
                    orderId: tempOrder._id!.toString(),
                    userId: user.userId.toString(),
                    userEmail: user.email
                }
            });

            // Update order with session ID
            tempOrder.stripeSessionId = session.id;
            await tempOrder.save();

            checkoutUrl = session.url;

            // Update product quantities
            for (const item of orderItems) {
                await Product.findByIdAndUpdate(
                    item.product,
                    { $inc: { quantity: -item.quantity } },
                    { new: true }
                );
            }

            const populatedOrder = await Order.findById(tempOrder._id)
                .populate('user', 'name email')
                .populate('items.product', 'name image');

            return {
                order: populatedOrder,
                checkoutUrl // Frontend will redirect to this URL
            };
        } catch (error: any) {
            throw new AppError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Stripe checkout session creation failed: ${error.message}`
            );
        }
    }

    // Create order for non-Stripe payments
    const order = await Order.create(orderData);

    // Update product quantities
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: -item.quantity } },
            { new: true }
        );
    }

    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.product', 'name image');

    return {
        order: populatedOrder,
        checkoutUrl: null
    };
};

// Get all orders (admin) or user's orders
const getAllOrders = async (query: Record<string, unknown>, user: JwtPayload) => {
    const orderQuery = new QueryBuilder(
        Order.find({ isDeleted: false }),
        query as Record<string, string>
    )
        .filter()
        .sort()
        .paginate()
        .fields();

    // If not admin, filter by user
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        orderQuery.modelQuery = orderQuery.modelQuery.find({ user: user.userId });
    }

    const result = await orderQuery.modelQuery
        .populate('user', 'name email')
        .populate('items.product', 'name image');
    
    const meta = await orderQuery.getMeta();

    return {
        meta,
        result
    };
};

// Get single order
const getSingleOrder = async (id: string, user: JwtPayload) => {
    const order = await Order.findById(id)
        .populate('user', 'name email')
        .populate('items.product', 'name image description');

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order has been deleted");
    }

    // Check authorization
    if (
        user.role !== 'ADMIN' && 
        user.role !== 'SUPER_ADMIN' && 
        order.user.toString() !== user.userId.toString()
    ) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to view this order");
    }

    return order;
};

// Update order status (admin only)
const updateOrderStatus = async (
    id: string,
    payload: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; notes?: string }
) => {
    const order = await Order.findById(id);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.isDeleted) {
        throw new AppError(httpStatus.BAD_REQUEST, "Cannot update deleted order");
    }

    const updateData: any = {};

    if (payload.orderStatus) updateData.orderStatus = payload.orderStatus;
    if (payload.paymentStatus) updateData.paymentStatus = payload.paymentStatus;
    if (payload.notes) updateData.notes = payload.notes;

    // If payment is marked as paid, set paidAt timestamp
    if (payload.paymentStatus === PaymentStatus.PAID && !order.paidAt) {
        updateData.paidAt = new Date();
    }

    const result = await Order.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    })
        .populate('user', 'name email')
        .populate('items.product', 'name image');

    return result;
};

// Handle Stripe webhook events
const handleStripeWebhook = async (event: Stripe.Event) => {
    switch (event.type) {
        // Checkout Session completed - PRIMARY EVENT
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            
            const order = await Order.findOne({ stripeSessionId: session.id });
            
            if (order) {
                order.paymentStatus = PaymentStatus.PAID;
                order.orderStatus = OrderStatus.PROCESSING;
                order.paidAt = new Date();
                await order.save();
                
                console.log(`✅ Payment succeeded via checkout for order: ${order.orderNumber}`);
            }
            break;
        }

        // Checkout Session expired
        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            
            const order = await Order.findOne({ stripeSessionId: session.id });
            
            if (order && order.paymentStatus === PaymentStatus.PENDING) {
                order.orderStatus = OrderStatus.CANCELLED;
                order.paymentStatus = PaymentStatus.FAILED;
                await order.save();

                // Restore product quantities
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { quantity: item.quantity } }
                    );
                }
                
                console.log(`⏱️ Checkout session expired for order: ${order.orderNumber}`);
            }
            break;
        }

        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
            
            if (order) {
                order.paymentStatus = PaymentStatus.PAID;
                order.orderStatus = OrderStatus.PROCESSING;
                order.paidAt = new Date();
                await order.save();
                
                console.log(`✅ Payment succeeded for order: ${order.orderNumber}`);
            }
            break;
        }

        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            
            const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
            
            if (order) {
                order.paymentStatus = PaymentStatus.FAILED;
                order.orderStatus = OrderStatus.FAILED;
                await order.save();

                // Restore product quantities
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { quantity: item.quantity } }
                    );
                }
                
                console.log(`❌ Payment failed for order: ${order.orderNumber}`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
};

// Get payment intent client secret
const getPaymentIntentSecret = async (orderId: string, user: JwtPayload) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.user.toString() !== user.userId.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to access this order");
    }

    if (!order.paymentIntentId) {
        throw new AppError(httpStatus.BAD_REQUEST, "No payment intent found for this order");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
    };
};

// Cancel order
const cancelOrder = async (id: string, user: JwtPayload) => {
    const order = await Order.findById(id);

    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    if (order.user.toString() !== user.userId.toString()) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized to cancel this order");
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "Only pending orders can be cancelled"
        );
    }

    // Cancel Stripe session if exists
    if (order.stripeSessionId) {
        try {
            await stripe.checkout.sessions.expire(order.stripeSessionId);
        } catch (error: any) {
            console.error('Stripe session expiration error:', error.message);
        }
    }

    // Cancel Stripe payment intent if exists (legacy support)
    if (order.paymentIntentId) {
        try {
            await stripe.paymentIntents.cancel(order.paymentIntentId);
        } catch (error: any) {
            console.error('Stripe cancellation error:', error.message);
        }
    }

    // Restore product quantities
    for (const item of order.items) {
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { quantity: item.quantity } }
        );
    }

    order.orderStatus = OrderStatus.CANCELLED;
    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    return order;
};

export const OrderServices = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    handleStripeWebhook,
    getPaymentIntentSecret,
    cancelOrder
};
