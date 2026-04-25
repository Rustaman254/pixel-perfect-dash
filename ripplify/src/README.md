# Ripplify - SME/MSME Payment Platform

## Overview

This is the frontend application for the Ripplify payment platform, a comprehensive solution for Small and Medium Enterprise (SME/MSME) payment processing.

## Tech Stack

- **React** + **TypeScript** - Modern frontend framework
- **Vite** - Fast build tool
- **Recharts** - Charting library for analytics
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React Icons** - Icon library
- **React Query** - Data fetching and state management
- **React Router** - Client-side routing

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ai/             # AI assistant
│   ├── dashboard/      # Dashboard layouts
│   ├── payments/       # Payment components
│   ├── products/       # Product management components
│   └── ui/            # UI primitives
├── contexts/           # React contexts
│   └── AppContext.tsx # Main app context
├── hooks/              # Custom hooks
├── lib/                # Utilities and API
│   ├── api.ts         # API client
│   └── utils.ts       # Helper functions
├── pages/              # Page components
│   ├── auth/          # Authentication pages
│   ├── products/      # Product management
│   ├── payments/      # Payment pages
│   └── dashboard/     # Dashboard pages
├── stores/             # State management
└── types/              # TypeScript types
    └── product.ts     # Product type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB with authentication

### Installation

```bash
npm install
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Available Scripts

- `npm run dev` - Start development server on port 5173
- `npm run build` - Build for production
- `npm run test` - Run tests with Vitest
- `npm run lint` - Lint code with ESLint
- `npm run pm2:start` - Start with PM2 process manager
- `npm run deploy:all` - Build and deploy all services

## Features

### Payment Processing
- Multi-provider payment support (Stripe, M-Pesa, Bank Transfer, Credit Card)
- Payment Intents with lifecycle management
- Webhook handling for payment notifications
- Transaction tracking with unique tokens

### Merchant Features
- Product catalog management
- Payment link creation
- Wallet management with multi-currency support
- Payout processing and tracking
- Analytics and reporting

### Security & Compliance
- Role-Based Access Control (RBAC)
- KYC/KYB verification workflow
- Multi-database architecture
- Feature flags for controlled rollout
- Webhook signature verification

## API Integration

The frontend integrates with the backend API through the `src/lib/api.ts` file:

### API Client Features
- Authenticated requests with JWT tokens
- Automatic retry logic
- Error handling and logging
- Request timeout (15 seconds)
- AbortController support

### Authentication
- JWT-based authentication
- API key support for public endpoints
- Token refresh handling
- Session management

## Environment Variables

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: `/api`)
- `VITE_STRIPE_KEY` - Stripe public key
- `VITE_MERCHANT_ID` - Merchant identifier

### Backend (.env)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret (64+ chars)
- `NODE_ENV` - Development/Production mode
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `PLATFORM_FEE` - Default platform fee percentage

## Database Architecture

### Primary Databases
1. **auth_db** - Authentication and user management
   - Users collection
   - API keys collection
   - Sessions collection

2. **ripplify_db** - Platform operations
   - Transactions collection
   - Payment links collection
   - Wallets collection
   - Payouts collection

3. **service_db** - Service configurations
   - Fee tiers collection
   - Feature flags collection
   - System settings collection

### Multi-Tenant Support
- Separate databases for different services
- Shared authentication across services
- Cross-database queries via MongoDB aggregation

## Payment Flow

1. **Merchant Onboarding**
   - Account creation with KYC verification
   - Fee tier selection
   - Payment method configuration

2. **Product Listing**
   - Create products with pricing
   - Configure payment methods
   - Set delivery options

3. **Payment Processing**
   - Customer initiates payment
   - Payment intent creation
   - Multi-provider processing
   - Status updates and notifications

4. **Fund Settlement**
   - Transaction completion
   - Fee calculation and deduction
   - Payout to merchant wallet

## Security Best Practices

- Never commit secrets to version control
- Use environment variables for sensitive data
- Implement proper error handling
- Validate all user input
- Use HTTPS in production
- Rate limiting on authentication endpoints
- Webhook signature verification
- Role-based access control
- Account status management (active/disabled/suspended)

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- path/to/test.spec.ts
```

## Monitoring

- Transaction logging
- Payment status tracking
- Merchant analytics
- System health monitoring
- Webhook delivery status

## Support

For issues and questions, please refer to the documentation or open a support ticket.