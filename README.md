# Simple REST Payment API

A production-ready RESTful API for e-commerce with integrated payment processing using Stripe. Built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Live Demo

- **API Base URL:** https://simple-rest-api-payment.vercel.app
- **Webhook Endpoint:** https://simple-rest-api-payment.vercel.app/api/v1/order/webhook
- **Health Check:** https://simple-rest-api-payment.vercel.app/

## 📋 Features

### Authentication & Authorization
- ✅ User registration with email verification required
- ✅ Email OTP verification before login access
- ✅ Login with JWT (requires verified account)
- ✅ Google OAuth integration
- ✅ Role-based access control (USER, ADMIN, SUPER_ADMIN)
- ✅ Password reset via email OTP
- ✅ Refresh token mechanism

### User Management
- ✅ Get logged-in user profile
- ✅ Update user information
- ✅ User list for admins

### Product Management
- ✅ Create, read, update, delete products
- ✅ Product listing with pagination
- ✅ Image upload with Cloudinary

### Order & Payment Processing
- ✅ Create order with Stripe Checkout Session
- ✅ Automatic payment status tracking via webhooks
- ✅ Order status management (PENDING → PROCESSING → COMPLETED)
- ✅ Success/Cancel payment pages
- ✅ Order history for users and admins

### Payment Integration
- ✅ Stripe payment gateway (test mode)
- ✅ Checkout Session implementation
- ✅ Webhook signature verification
- ✅ Automatic order status updates on payment success/failure

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT, Passport.js (Google OAuth)
- **Payment Gateway:** Stripe
- **Validation:** Zod
- **Email:** Nodemailer
- **Image Upload:** Cloudinary
- **Deployment:** Vercel

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Stripe account (test mode)

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/hassan-nahid/simple-rest-api-payment.git
cd simple-rest-payment
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000
DB_URL=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
# ... other variables
```

4. **Run the application**

Development mode:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm start
```

5. **Test the API**

Import `Simple REST Payment API.postman_collection.json` into Postman.

## � Authentication Flow

### User Registration & Verification Process

```
1. User Registration (POST /api/v1/user/register)
   ↓
2. OTP sent to user's email
   ↓
3. User verifies email (POST /api/v1/otp/verify)
   ↓
4. Account activated (isVerified = true)
   ↓
5. User can now login (POST /api/v1/auth/login)
```

**Important Notes:**
- ⚠️ Users MUST verify their email before logging in
- ⚠️ Attempting to login without verification returns error: "User not verified"
- ⚠️ OTP expires after a certain time period
- ✅ Google OAuth users are auto-verified
- ✅ Verification required only for email/password registration

### Login Flow

```
Verified User → Login → JWT Token → Access Protected Routes
Unverified User → Login → Error: "User not verified" → Must verify email first
```

## �🔄 Payment Flow

### Complete Order and Payment Process

```
1. User Registration/Login
   ↓
2. Browse Products (GET /api/v1/product)
   ↓
3. Create Order (POST /api/v1/order/create)
   ↓
4. Receive Checkout URL in response
   ↓
5. User redirected to Stripe Checkout Page
   ↓
6. User completes payment
   ↓
7. Stripe sends webhook event
   ↓
8. Backend handles webhook (POST /api/v1/order/webhook)
   ↓
9. Order status: PENDING → PROCESSING
   Payment status: PENDING → PAID
   ↓
10. User redirected to success page
    (Backend-served HTML page)
```

### Technical Payment Flow

**Order Creation:**
```javascript
POST /api/v1/order/create
Authorization: Bearer <token>

{
  "items": [
    {"product": "productId", "quantity": 2}
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "shippingAddress": "123 Main St"
}

Response:
{
  "order": { ...orderDetails },
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

**Stripe Checkout Session:**
- User is redirected to Stripe-hosted payment page
- Secure payment processing by Stripe
- No sensitive payment data touches our server

**Webhook Processing:**
```javascript
Event: checkout.session.completed
→ Update order: paymentStatus = "PAID"
→ Update order: orderStatus = "PROCESSING"
→ Set paidAt timestamp

Event: checkout.session.expired
→ Keep order in PENDING state
→ User can retry payment
```

**Success/Cancel Handling:**
- Success: `GET /api/v1/order/payment-success?sessionId=xxx&orderId=xxx`
- Cancel: `GET /api/v1/order/payment-cancelled?orderId=xxx`
- Both serve beautiful HTML pages from backend

## 📚 API Documentation

### Base URL
```
Local: http://localhost:5000/api/v1
Production: https://simple-rest-api-payment.vercel.app/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/user/register` | Register new user (sends OTP) | No |
| POST | `/otp/verify` | Verify email with OTP | No |
| POST | `/auth/login` | Login user (requires verification) | No |
| POST | `/auth/refresh-token` | Refresh access token | No |
| GET | `/auth/google` | Google OAuth login | No |

### OTP Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/otp/send` | Send OTP to email | No |
| POST | `/otp/verify` | Verify OTP code | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/user/me` | Get current user profile | Yes |
| GET | `/user` | Get all users (admin) | Yes (Admin) |
| PATCH | `/user/:id` | Update user | Yes |

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/product/create` | Create product | Yes (Admin) |
| GET | `/product` | Get all products | No |
| GET | `/product/:id` | Get single product | No |
| PATCH | `/product/:id` | Update product | Yes (Admin) |
| DELETE | `/product/:id` | Delete product | Yes (Admin) |

### Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/order/create` | Create order & get checkout URL | Yes |
| GET | `/order` | Get user's orders | Yes |
| GET | `/order/:id` | Get single order | Yes |
| PATCH | `/order/:id/status` | Update order status | Yes (Admin) |
| DELETE | `/order/:id` | Cancel order | Yes |
| POST | `/order/webhook` | Stripe webhook handler | No (Verified) |
| GET | `/order/payment-success` | Payment success page | No |
| GET | `/order/payment-cancelled` | Payment cancel page | No |

## 🔐 Authentication

### Getting Started with Authentication

**Step 1: Register**
```bash
POST /api/v1/user/register
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "password123"
}
```
Response: OTP sent to email

**Step 2: Verify Email**
```bash
POST /api/v1/otp/verify
{
  "email": "user@example.com",
  "otp": "123456"
}
```
Response: Account verified

**Step 3: Login**
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response: JWT access & refresh tokens

**Important:** Attempting to login without verification will return:
```json
{
  "success": false,
  "message": "User not verified. Please verify your email first."
}
```

### Using Protected Routes

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing with Postman

1. Import `Simple REST Payment API.postman_collection.json`
2. Set environment variables:
   - `baseUrl`: Your API URL
   - `accessToken`: Will be auto-set after login
3. Run "Login" request first
4. Access token is automatically saved
5. Test order creation to get checkout URL
6. Use Stripe test cards for payment:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## 🚀 Deployment

### Vercel Deployment

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables**

In Vercel Dashboard → Settings → Environment Variables, add:
- `BASE_URL` (your Vercel URL)
- `DB_URL` (MongoDB connection)
- `JWT_ACCESS_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- All other .env variables

4. **Configure Stripe Webhook**

In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://your-app.vercel.app/api/v1/order/webhook`
- Select events: `checkout.session.completed`, `checkout.session.expired`
- Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Important: Webhook Configuration

The webhook route **MUST** be mounted before `express.json()` middleware to preserve raw body for signature verification:

```typescript
// app.ts
app.post('/api/v1/order/webhook',
  express.raw({ type: 'application/json' }),
  OrderControllers.handleStripeWebhook
);

// Then other middleware
app.use(express.json());
```

## 🔧 Project Structure

```
src/
├── app/
│   ├── config/          # Configuration files
│   │   ├── env.ts
│   │   ├── passport.ts
│   │   └── stripe.config.ts
│   ├── middleware/      # Express middleware
│   │   ├── CheckAuth.ts
│   │   ├── ValidateRequest.ts
│   │   └── globalErrorHandler.ts
│   ├── modules/         # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── user/        # User management
│   │   ├── product/     # Product management
│   │   ├── order/       # Order & payment
│   │   └── otp/         # OTP verification
│   ├── routers/         # Route definitions
│   └── utils/           # Utility functions
├── app.ts               # Express app setup
└── server.ts            # Server entry point
```

## 🧪 Testing Stripe Payments

### Test Card Numbers
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires 3DS: 4000 0025 0000 3155
```

### Local Webhook Testing

1. Install Stripe CLI:
```bash
stripe login
```

2. Forward webhooks to local:
```bash
stripe listen --forward-to localhost:5000/api/v1/order/webhook
```

3. Get webhook secret and add to `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

## 📝 Environment Variables

See `.env.example` for all required variables.

**Critical Variables:**
- `BASE_URL` - Your backend URL (for Stripe redirects)
- `STRIPE_SECRET_KEY` - Stripe secret key (test mode)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `DB_URL` - MongoDB connection string
- `JWT_ACCESS_SECRET` - JWT signing secret

## 🛡️ Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Stripe webhook signature verification
- CORS configuration
- Rate limiting ready
- Input validation with Zod
- SQL injection prevention (NoSQL)
- XSS protection

## 📊 Order Status Flow

```
PENDING → User creates order, awaiting payment
    ↓
PROCESSING → Payment successful, order being prepared
    ↓
COMPLETED → Order delivered (manual admin update)
    ↓
CANCELLED → Order cancelled by user/admin
```

## 🤝 Contributing

This is an assignment project. For production use, consider:
- Adding rate limiting
- Implementing caching (Redis)
- Adding comprehensive tests
- Setting up CI/CD pipeline
- Adding API documentation (Swagger)

## 📄 License

This project is created for technical assignment purposes.

## 👨‍💻 Author

**Hassan Nahid**
- GitHub: [@hassan-nahid](https://github.com/hassan-nahid)

## 📞 Support

For any questions or issues, please open an issue in the GitHub repository.

---

**Note:** This project uses Stripe test mode. No real payments are processed. Always use test cards for payment testing.
