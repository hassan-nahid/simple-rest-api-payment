# 🚀 Payment Testing Guide - Stripe Checkout Integration

## ✅ Implementation Complete!

আপনার Order এবং Payment system এখন সম্পূর্ণভাবে Backend থেকে handle হচ্ছে Stripe Checkout Session দিয়ে।

---

## 📋 What Was Changed:

### 1. **order.service.ts**
- ✅ `createOrder()` এখন Stripe Checkout Session তৈরি করে
- ✅ Response এ `checkoutUrl` return করে
- ✅ Webhook handler এ `checkout.session.completed` এবং `checkout.session.expired` events যোগ হয়েছে
- ✅ `cancelOrder()` এখন Checkout Session expire করে

### 2. **order.controller.ts**
- ✅ `createOrder()` controller এখন `{order, checkoutUrl}` return করে
- ✅ Dynamic message যদি checkoutUrl থাকে

---

## 🔧 Setup Instructions:

### Step 1: Stripe Account Setup

1. **Stripe Account তৈরি করো**: https://dashboard.stripe.com/register
2. **Test Mode enable করো** (Development এর জন্য)
3. **API Keys collect করো**:
   - Navigate: `Developers` → `API Keys`
   - Copy করো: `Publishable key` এবং `Secret key`

### Step 2: Environment Variables

তোমার `.env` file এ এই keys add করো:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Frontend URL (Success/Cancel redirect এর জন্য)
FRONTEND_URL=http://localhost:3000
```

### Step 3: Webhook Setup (Production এর জন্য)

1. Stripe Dashboard: `Developers` → `Webhooks`
2. Click **"Add endpoint"**
3. Endpoint URL: `https://yourdomain.com/api/order/webhook`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy webhook secret এবং `.env` এ add করো

**Development এর জন্য** Stripe CLI ব্যবহার করো:
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:5000/api/order/webhook

# Copy webhook secret from terminal output
```

---

## 🧪 Testing in Postman:

### Step 1: Create Order

**Request:**
```http
POST http://localhost:5000/api/order/create
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "items": [
    {
      "product": "YOUR_PRODUCT_ID",
      "quantity": 2
    }
  ],
  "paymentMethod": "STRIPE",
  "customerEmail": "test@example.com",
  "customerName": "Test User",
  "shippingAddress": "123 Main Street, City",
  "notes": "Test order"
}
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order created successfully. Redirecting to payment...",
  "data": {
    "order": {
      "_id": "67890abcdef123456",
      "orderNumber": "ORD-1705450000000-1234",
      "items": [...],
      "totalAmount": 5000,
      "orderStatus": "PENDING",
      "paymentStatus": "PENDING",
      "stripeSessionId": "cs_test_xxxxxxxxxxxxx",
      ...
    },
    "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxxxxxx"
  }
}
```

### Step 2: Browser এ Checkout URL Open করো

1. Response থেকে `checkoutUrl` copy করো
2. Browser এ paste করো
3. Stripe Checkout page খুলবে

### Step 3: Test Card দিয়ে Payment করো

Stripe Test Cards:

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |
| `4000 0025 0000 3155` | ⚠️ Requires Authentication |

**Card Details:**
- Expiry: Any future date (e.g., `12/26`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

### Step 4: Verify Order Status

**Request:**
```http
GET http://localhost:5000/api/order/ORDER_ID
Authorization: Bearer YOUR_JWT_TOKEN
```

**Expected Response (After Successful Payment):**
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "67890abcdef123456",
    "orderStatus": "PROCESSING",
    "paymentStatus": "PAID",
    "paidAt": "2026-01-17T10:30:00.000Z",
    ...
  }
}
```

---

## 🔍 Webhook Testing:

### Monitor Webhook Events:

**Check Terminal Logs:**
```
✅ Payment succeeded via checkout for order: ORD-1705450000000-1234
```

**Verify Database:**
- Order status updated to `PROCESSING`
- Payment status updated to `PAID`
- `paidAt` timestamp set

### Test Webhook Manually (Postman):

```http
POST http://localhost:5000/api/order/webhook
Content-Type: application/json

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxxxxxxxxxxxx",
      "payment_status": "paid"
    }
  }
}
```

---

## 🎯 Frontend Integration Example:

```typescript
// React/Next.js Example
const handleCheckout = async () => {
  try {
    const response = await fetch('/api/order/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{product: productId, quantity: 2}],
        paymentMethod: 'STRIPE',
        customerEmail: 'user@example.com'
      })
    });

    const result = await response.json();
    
    if (result.success && result.data.checkoutUrl) {
      // ✅ Auto redirect to Stripe Checkout
      window.location.href = result.data.checkoutUrl;
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🎨 Success/Cancel Pages:

Frontend এ এই routes তৈরি করো:

### Success Page: `/payment-success`
```typescript
// Example: pages/payment-success.tsx
const PaymentSuccess = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const orderId = searchParams.get('orderId');

  return (
    <div>
      <h1>Payment Successful! 🎉</h1>
      <p>Order ID: {orderId}</p>
      <p>Session ID: {sessionId}</p>
    </div>
  );
};
```

### Cancel Page: `/payment-cancelled`
```typescript
// Example: pages/payment-cancelled.tsx
const PaymentCancelled = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div>
      <h1>Payment Cancelled ❌</h1>
      <p>Order ID: {orderId}</p>
      <button onClick={() => router.push('/cart')}>
        Return to Cart
      </button>
    </div>
  );
};
```

---

## 📊 Complete Flow:

```
┌─────────────────────────────────────────┐
│ User clicks "Place Order"               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ POST /api/order/create                  │
│ - Validate products                     │
│ - Calculate total                       │
│ - Create order (PENDING)                │
│ - Create Stripe Checkout Session        │
│ - Reserve product stock                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Response: {order, checkoutUrl}          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Frontend: window.location = checkoutUrl │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ User lands on Stripe Checkout Page      │
│ - Enters card details                   │
│ - Clicks "Pay"                          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Stripe processes payment                │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Webhook: POST /api/order/webhook        │
│ Event: checkout.session.completed       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Backend updates order:                  │
│ - paymentStatus = PAID                  │
│ - orderStatus = PROCESSING              │
│ - paidAt = now()                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ User redirected to success page         │
│ /payment-success?orderId=xxx            │
└─────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting:

### Problem: Webhook not receiving events
**Solution:**
- Development: Use Stripe CLI `stripe listen --forward-to localhost:5000/api/order/webhook`
- Production: Verify webhook endpoint URL in Stripe Dashboard
- Check firewall/network settings

### Problem: "No such customer" error
**Solution:**
- Don't pass customer ID if not already created in Stripe
- Let Stripe create customer automatically

### Problem: Order created but payment not updating
**Solution:**
- Check webhook logs in terminal
- Verify `stripeSessionId` is saved in order
- Check Stripe Dashboard → Events for webhook delivery status

### Problem: Product stock not restoring on failed payment
**Solution:**
- Webhook handler automatically restores stock
- Verify webhook events are being received
- Check `checkout.session.expired` event handling

---

## 🎉 You're All Set!

এখন তোমার payment system সম্পূর্ণ Backend-driven এবং Production-ready!

**Key Features:**
✅ Secure payment processing via Stripe
✅ Automatic order status updates via webhooks
✅ Product stock management
✅ Payment failure handling
✅ Session expiration handling
✅ No sensitive card data touches your server

---

## 📚 Additional Resources:

- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Test Cards List](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

**Happy Coding! 🚀**
