# 📋 Order & Payment Testing - Quick Guide

## ✅ Updated Order Endpoints

The Postman collection has been updated with essential Order endpoints only:

### Order & Payment Section:

1. **Create Order (Get Checkout URL)** 🔥
   - Creates order and returns Stripe Checkout URL
   - Auto-saves: Order ID, Checkout URL
   - Shows checkout URL in Console tab with instructions
   
2. **Get All Orders**
   - View all orders (Users: own orders, Admins: all orders)
   - Supports pagination and filtering
   
3. **Get Single Order**
   - View order details
   - Use this to verify payment status after checkout
   
4. **Update Order Status (Admin)**
   - Admin can update order/payment status
   - Change order status: PENDING → PROCESSING → COMPLETED
   
5. **Cancel Order**
   - Cancel pending order
   - Expires Stripe session
   - Restores product stock
   
6. **Stripe Webhook**
   - Auto-called by Stripe (don't call manually)
   - For testing webhook only

---

## 🚀 Testing Flow:

```
1. Login → Get Token
2. Create Product → Get Product ID
3. Create Order → Get Checkout URL (check Console tab!)
4. Open Checkout URL in browser
5. Pay with test card: 4242 4242 4242 4242
6. Get Single Order → Verify payment status
```

---

## 💡 What Changed:

✅ **Removed:** "Get Payment Intent Secret" (not needed anymore)
✅ **Updated:** "Create Order" now returns checkout URL
✅ **Added:** Auto-save checkout URL to variables
✅ **Added:** Beautiful console output with payment instructions

---

## 📝 Console Output:

After creating order, check Console tab in Postman:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 ORDER CREATED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CHECKOUT URL:
https://checkout.stripe.com/c/pay/cs_test_xxxxx

👉 COPY THE URL ABOVE AND PASTE IN YOUR BROWSER
💳 Use test card: 4242 4242 4242 4242
📅 Expiry: 12/26 | CVC: 123
```

---

## 🔑 Collection Variables:

Auto-saved during testing:
- `accessToken` - From login
- `productId` - From create product
- `orderId` - From create order
- `checkoutUrl` - From create order (NEW!)

---

All other endpoints (Auth, User, Product, OTP) remain unchanged! 🎉
