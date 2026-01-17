"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderServices = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const stripe_config_1 = require("../../config/stripe.config");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const product_model_1 = require("../product/product.model");
const order_interface_1 = require("./order.interface");
const order_model_1 = require("./order.model");
const env_1 = require("../../config/env");
// Generate unique order number
const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD-${timestamp}-${random}`;
};
// Create order with Stripe payment intent
const createOrder = (payload, user) => __awaiter(void 0, void 0, void 0, function* () {
    const { items, paymentMethod, customerEmail, customerName, shippingAddress, notes } = payload;
    if (!items || items.length === 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Order must have at least one item");
    }
    // Validate products and calculate total
    const orderItems = [];
    let totalAmount = 0;
    for (const item of items) {
        const product = yield product_model_1.Product.findById(item.product);
        if (!product) {
            throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, `Product with ID ${item.product} not found`);
        }
        if (product.isDeleted) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Product ${product.name} is no longer available`);
        }
        if (!product.isActive) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Product ${product.name} is currently inactive`);
        }
        if (product.quantity < item.quantity) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, `Insufficient stock for ${product.name}. Available: ${product.quantity}`);
        }
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        orderItems.push({
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal
        });
    }
    const orderNumber = generateOrderNumber();
    // Create order object
    const orderData = {
        user: user.userId,
        orderNumber,
        items: orderItems,
        totalAmount,
        paymentMethod: paymentMethod || order_interface_1.PaymentMethod.STRIPE,
        orderStatus: order_interface_1.OrderStatus.PENDING,
        paymentStatus: order_interface_1.PaymentStatus.PENDING,
        customerEmail: customerEmail || user.email,
        customerName: customerName || user.name,
        shippingAddress,
        notes
    };
    // Create Stripe Checkout Session if payment method is STRIPE
    let checkoutUrl = null;
    if (paymentMethod === order_interface_1.PaymentMethod.STRIPE) {
        try {
            // Create order first to get order ID
            const tempOrder = yield order_model_1.Order.create(orderData);
            // Create Stripe Checkout Session
            const session = yield stripe_config_1.stripe.checkout.sessions.create({
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
                success_url: `${env_1.envVars.BASE_URL}/api/v1/order/payment-success?sessionId={CHECKOUT_SESSION_ID}&orderId=${tempOrder._id}`,
                cancel_url: `${env_1.envVars.BASE_URL}/api/v1/order/payment-cancelled?orderId=${tempOrder._id}`,
                metadata: {
                    orderNumber,
                    orderId: tempOrder._id.toString(),
                    userId: user.userId.toString(),
                    userEmail: user.email
                }
            });
            // Update order with session ID
            tempOrder.stripeSessionId = session.id;
            yield tempOrder.save();
            checkoutUrl = session.url;
            // Update product quantities
            for (const item of orderItems) {
                yield product_model_1.Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } }, { new: true });
            }
            const populatedOrder = yield order_model_1.Order.findById(tempOrder._id)
                .populate('user', 'name email')
                .populate('items.product', 'name image');
            return {
                order: populatedOrder,
                checkoutUrl // Frontend will redirect to this URL
            };
        }
        catch (error) {
            throw new AppError_1.default(http_status_codes_1.default.INTERNAL_SERVER_ERROR, `Stripe checkout session creation failed: ${error.message}`);
        }
    }
    // Create order for non-Stripe payments
    const order = yield order_model_1.Order.create(orderData);
    // Update product quantities
    for (const item of orderItems) {
        yield product_model_1.Product.findByIdAndUpdate(item.product, { $inc: { quantity: -item.quantity } }, { new: true });
    }
    const populatedOrder = yield order_model_1.Order.findById(order._id)
        .populate('user', 'name email')
        .populate('items.product', 'name image');
    return {
        order: populatedOrder,
        checkoutUrl: null
    };
});
// Get all orders (admin) or user's orders
const getAllOrders = (query, user) => __awaiter(void 0, void 0, void 0, function* () {
    const orderQuery = new QueryBuilder_1.QueryBuilder(order_model_1.Order.find({ isDeleted: false }), query)
        .filter()
        .sort()
        .paginate()
        .fields();
    // If not admin, filter by user
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        orderQuery.modelQuery = orderQuery.modelQuery.find({ user: user.userId });
    }
    const result = yield orderQuery.modelQuery
        .populate('user', 'name email')
        .populate('items.product', 'name image');
    const meta = yield orderQuery.getMeta();
    return {
        meta,
        result
    };
});
// Get single order
const getSingleOrder = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(id)
        .populate('user', 'name email')
        .populate('items.product', 'name image description');
    if (!order) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    if (order.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Order has been deleted");
    }
    // Check authorization
    if (user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN' &&
        order.user.toString() !== user.userId.toString()) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized to view this order");
    }
    return order;
});
// Update order status (admin only)
const updateOrderStatus = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(id);
    if (!order) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    if (order.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Cannot update deleted order");
    }
    const updateData = {};
    if (payload.orderStatus)
        updateData.orderStatus = payload.orderStatus;
    if (payload.paymentStatus)
        updateData.paymentStatus = payload.paymentStatus;
    if (payload.notes)
        updateData.notes = payload.notes;
    // If payment is marked as paid, set paidAt timestamp
    if (payload.paymentStatus === order_interface_1.PaymentStatus.PAID && !order.paidAt) {
        updateData.paidAt = new Date();
    }
    const result = yield order_model_1.Order.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    })
        .populate('user', 'name email')
        .populate('items.product', 'name image');
    return result;
});
// Handle Stripe webhook events
const handleStripeWebhook = (event) => __awaiter(void 0, void 0, void 0, function* () {
    switch (event.type) {
        // Checkout Session completed - PRIMARY EVENT
        case 'checkout.session.completed': {
            const session = event.data.object;
            const order = yield order_model_1.Order.findOne({ stripeSessionId: session.id });
            if (order) {
                order.paymentStatus = order_interface_1.PaymentStatus.PAID;
                order.orderStatus = order_interface_1.OrderStatus.PROCESSING;
                order.paidAt = new Date();
                yield order.save();
                console.log(`✅ Payment succeeded via checkout for order: ${order.orderNumber}`);
            }
            break;
        }
        // Checkout Session expired
        case 'checkout.session.expired': {
            const session = event.data.object;
            const order = yield order_model_1.Order.findOne({ stripeSessionId: session.id });
            if (order && order.paymentStatus === order_interface_1.PaymentStatus.PENDING) {
                order.orderStatus = order_interface_1.OrderStatus.CANCELLED;
                order.paymentStatus = order_interface_1.PaymentStatus.FAILED;
                yield order.save();
                // Restore product quantities
                for (const item of order.items) {
                    yield product_model_1.Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
                }
                console.log(`⏱️ Checkout session expired for order: ${order.orderNumber}`);
            }
            break;
        }
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const order = yield order_model_1.Order.findOne({ paymentIntentId: paymentIntent.id });
            if (order) {
                order.paymentStatus = order_interface_1.PaymentStatus.PAID;
                order.orderStatus = order_interface_1.OrderStatus.PROCESSING;
                order.paidAt = new Date();
                yield order.save();
                console.log(`✅ Payment succeeded for order: ${order.orderNumber}`);
            }
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            const order = yield order_model_1.Order.findOne({ paymentIntentId: paymentIntent.id });
            if (order) {
                order.paymentStatus = order_interface_1.PaymentStatus.FAILED;
                order.orderStatus = order_interface_1.OrderStatus.FAILED;
                yield order.save();
                // Restore product quantities
                for (const item of order.items) {
                    yield product_model_1.Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
                }
                console.log(`❌ Payment failed for order: ${order.orderNumber}`);
            }
            break;
        }
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
});
// Get payment intent client secret
const getPaymentIntentSecret = (orderId, user) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(orderId);
    if (!order) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    if (order.user.toString() !== user.userId.toString()) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized to access this order");
    }
    if (!order.paymentIntentId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "No payment intent found for this order");
    }
    const paymentIntent = yield stripe_config_1.stripe.paymentIntents.retrieve(order.paymentIntentId);
    return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
    };
});
// Cancel order
const cancelOrder = (id, user) => __awaiter(void 0, void 0, void 0, function* () {
    const order = yield order_model_1.Order.findById(id);
    if (!order) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Order not found");
    }
    if (order.user.toString() !== user.userId.toString()) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "You are not authorized to cancel this order");
    }
    if (order.orderStatus !== order_interface_1.OrderStatus.PENDING) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Only pending orders can be cancelled");
    }
    // Cancel Stripe session if exists
    if (order.stripeSessionId) {
        try {
            yield stripe_config_1.stripe.checkout.sessions.expire(order.stripeSessionId);
        }
        catch (error) {
            console.error('Stripe session expiration error:', error.message);
        }
    }
    // Cancel Stripe payment intent if exists (legacy support)
    if (order.paymentIntentId) {
        try {
            yield stripe_config_1.stripe.paymentIntents.cancel(order.paymentIntentId);
        }
        catch (error) {
            console.error('Stripe cancellation error:', error.message);
        }
    }
    // Restore product quantities
    for (const item of order.items) {
        yield product_model_1.Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
    }
    order.orderStatus = order_interface_1.OrderStatus.CANCELLED;
    order.paymentStatus = order_interface_1.PaymentStatus.FAILED;
    yield order.save();
    return order;
});
exports.OrderServices = {
    createOrder,
    getAllOrders,
    getSingleOrder,
    updateOrderStatus,
    handleStripeWebhook,
    getPaymentIntentSecret,
    cancelOrder
};
