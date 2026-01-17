# 🔧 Webhook Setup - Fix Payment Status Issue

## ❌ Problem:
Payment successful হওয়ার পরেও order status PENDING থেকে যাচ্ছে।

## ✅ Solution:
Webhook events local server এ পৌঁছাচ্ছে না। Development এ Stripe CLI দিয়ে webhook forward করতে হবে।

---

## 🚀 Quick Fix:

### Step 1: Install Stripe CLI

```powershell
# Windows (PowerShell)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

অথবা Download: https://github.com/stripe/stripe-cli/releases/latest

### Step 2: Login to Stripe

```powershell
stripe login
```

Browser এ Stripe Dashboard খুলবে, allow করুন।

### Step 3: Forward Webhook to Local Server

```powershell
stripe listen --forward-to http://localhost:5000/api/v1/order/webhook
```

**Output দেখবেন:**
```
> Ready! You are using Stripe API Version [2025-12-15]
> Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Copy Webhook Secret to .env

Terminal থেকে `whsec_xxxxx` copy করে `.env` file এ update করুন:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Restart Server

```powershell
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## 🧪 Test Again:

1. **Create Order** in Postman
2. **Open Checkout URL** in browser
3. **Pay** with test card: `4242 4242 4242 4242`
4. **Check Terminal** - দেখবেন:
   ```
   ✅ Payment succeeded via checkout for order: ORD-xxxxx
   ```

5. **Get Single Order** - এখন দেখবেন:
   ```json
   {
     "orderStatus": "PROCESSING",
     "paymentStatus": "PAID",
     "paidAt": "2026-01-17T..."
   }
   ```

---

## 🎯 Alternative: Manual Webhook Test

যদি Stripe CLI install করতে না চান, webhook manually test করতে পারেন:

### Get Session ID from Order:

```
GET http://localhost:5000/api/v1/order/{{orderId}}
```

Response থেকে `stripeSessionId` copy করুন।

### Call Webhook Manually:

```
POST http://localhost:5000/api/v1/order/webhook
Content-Type: application/json

{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "PASTE_YOUR_SESSION_ID_HERE",
      "payment_status": "paid"
    }
  }
}
```

---

## 📋 Verify Logs:

Server terminal এ এরকম দেখবেন যখন webhook সফল হবে:

```
✅ Payment succeeded via checkout for order: ORD-1705450000000-1234
```

যদি না দেখেন, মানে webhook receive হচ্ছে না।

---

## 🔍 Debug Checklist:

✅ Server running আছে কিনা
✅ Stripe CLI running আছে কিনা (`stripe listen`)
✅ Webhook secret .env তে ঠিক আছে কিনা
✅ Server restart করেছেন কিনা
✅ Payment করার পরে terminal log check করেছেন কিনা

---

## 💡 Production Setup:

Production এ Stripe CLI লাগবে না। Stripe Dashboard থেকে webhook setup করতে হবে:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click: **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/v1/order/webhook`
4. Events: Select `checkout.session.completed` and `checkout.session.expired`
5. Copy webhook secret and add to production `.env`

---

এখন test করুন! 🚀
