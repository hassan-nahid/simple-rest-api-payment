## 🔍 Quick Webhook Test

আপনার order এর webhook manually trigger করতে এই steps follow করুন:

### Step 1: Get Order Details

Postman এ run করুন:
```
GET http://localhost:5000/api/v1/order/{{orderId}}
```

Response থেকে `stripeSessionId` copy করুন।

### Step 2: Manually Trigger Webhook

Postman এ new request:

**URL:** `POST http://localhost:5000/api/v1/order/webhook`

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "PASTE_YOUR_STRIPE_SESSION_ID_HERE",
      "payment_status": "paid"
    }
  }
}
```

### Step 3: Check Response

Should return: `{ "received": true }`

### Step 4: Verify Order Status

```
GET http://localhost:5000/api/v1/order/{{orderId}}
```

এখন দেখবেন:
```json
{
  "orderStatus": "PROCESSING",
  "paymentStatus": "PAID",
  "paidAt": "2026-01-17T..."
}
```

### Step 5: Check Terminal Logs

Server terminal এ দেখবেন:
```
🔔 Webhook received: checkout.session.completed
📋 Session ID: cs_test_xxxxx
✅ Payment succeeded via checkout for order: ORD-xxxxx
```

---

## ⚠️ যদি কাজ না করে:

1. **Check stripeSessionId:**
   - Order detail এ `stripeSessionId` আছে কিনা verify করুন
   - যদি `null` হয়, order creation এ সমস্যা আছে

2. **Check Terminal Logs:**
   - Webhook receive হচ্ছে কিনা দেখুন
   - "Order not found" দেখালে session ID mismatch

3. **Restart Server:**
   ```powershell
   # Press Ctrl+C to stop
   npm run dev
   ```

---

এই method দিয়ে manually test করে দেখুন কাজ করছে কিনা। তারপর production এ Stripe CLI দিয়ে real webhook test করবেন। 🚀
