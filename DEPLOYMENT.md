# Ripplify Ecosystem - Complete Setup & Deployment Guide

## Table of Contents
- [Project Structure](#project-structure)
- [Local / Offline Development](#local--offline-development)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment (VPS)](#backend-deployment-vps)
- [Nginx & SSL Configuration](#nginx--ssl-configuration)
- [PM2 Process Management](#pm2-process-management)
- [Admin Panel Features](#admin-panel-features)
- [Environment Variables Reference](#environment-variables-reference)
- [Troubleshooting](#troubleshooting)

---

## Project Structure

```
RippliFy/
├── package.json              # Root monorepo config
├── ecosystem.config.cjs      # PM2 process definitions
├── .env.example              # Environment template
│
├── packages/shared/          # Shared frontend code (types, utils, UI components, hooks)
│   └── src/
│       ├── lib/              # api.ts, utils.ts, types.ts
│       ├── components/ui/    # 17 shadcn/ui components
│       ├── hooks/            # useToast, useSSOSync
│       └── styles/           # globals.css
│
├── ripplify/                 # Ripplify seller dashboard (port 8080)
│   ├── src/
│   │   ├── pages/            # Seller pages + admin pages
│   │   ├── components/       # Layout, sidebar, UI components
│   │   ├── contexts/         # AppContext (auth, SSO)
│   │   └── hooks/            # Custom hooks
│   └── vite.config.ts
│
├── admin/                    # Standalone admin panel (port 8083)
│   ├── src/
│   │   ├── pages/            # 15 admin pages (full feature parity)
│   │   ├── components/       # AdminLayout, UserRoleManager, UI components
│   │   ├── contexts/         # AppContext (auth, SSO)
│   │   └── lib/              # API client, utilities
│   └── vite.config.ts
│
├── shopalize/                # Shopalize storefront (port 8081)
├── insights/                 # Watchtower/Insights analytics (port 8082)
│
├── server/                   # Main backend (monolith, port 3001)
│   ├── index.js
│   ├── routes/               # API route handlers
│   ├── services/             # Email, SMS services
│   └── utils/                # Payment, crypto, RBAC utilities
│
├── services/                 # Microservices (if using split architecture)
│   ├── shared/               # Shared backend code (auth, db, serviceClient)
│   ├── auth-service/         # Port 3001
│   ├── ripplify-service/     # Port 3002
│   ├── shopalize-service/    # Port 3003
│   ├── watchtower-service/   # Port 3004
│   └── admin-service/        # Port 3005
│
├── nginx/                    # Nginx config + SSL setup
│   ├── ecosystem.conf        # Full SSL reverse proxy config
│   ├── options-ssl-nginx.conf
│   └── setup-ssl.sh          # One-click SSL setup script
│
├── scripts/
│   └── test-deployment.sh    # Health check script
│
└── logs/                     # PM2 log output directory
```

---

## Local / Offline Development

### Prerequisites

```bash
# Required software
node --version   # v18+ (recommended v22+)
npm --version    # v9+
git --version    # any recent version

# Optional
pm2 --version    # for process management
nginx -v         # for reverse proxy testing
```

### Step 1: Clone & Install

```bash
git clone <your-repo-url> RippliFy
cd RippliFy

# Install root dependencies (optional, for monorepo scripts)
npm install

# Install Ripplify frontend dependencies
cd ripplify && npm install && cd ..

# Install Admin frontend dependencies
cd admin && npm install && cd ..

# Install backend dependencies (monolith)
cd server && npm install && cd ..

# OR install microservices dependencies
cd services/auth-service && npm install && cd ../..
cd services/ripplify-service && npm install && cd ../..
cd services/admin-service && npm install && cd ../..
cd services/watchtower-service && npm install && cd ../..
cd services/shared && npm install && cd ../..
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your local values:

```env
# PostgreSQL (use local or Docker)
PG_HOST=localhost
PG_PORT=5432
PG_USER=sokostack
PG_PASSWORD=your_local_password

# JWT
JWT_SECRET=local-dev-secret-not-for-production

# Internal Service Communication
INTERNAL_API_KEY=local-internal-key

# Service URLs (local ports)
AUTH_SERVICE_URL=http://127.0.0.1:3001
RIPPLIFY_SERVICE_URL=http://127.0.0.1:3002
SHOPALIZE_SERVICE_URL=http://127.0.0.1:3003
WATCHTOWER_SERVICE_URL=http://127.0.0.1:3004
ADMIN_SERVICE_URL=http://127.0.0.1:3005

# Frontend URLs (local)
FRONTEND_URL=http://localhost:8080
CORS_ORIGINS=http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:8083,http://localhost:3000,http://localhost:5173

# Payment Providers (leave empty for local dev)
INTASEND_API_KEY=
FLUTTERWAVE_SECRET_KEY=

NODE_ENV=development
```

Also create frontend `.env` files:

```bash
# ripplify/.env.local
VITE_API_URL=http://localhost:3002/api
VITE_SSO_URL=http://localhost:3001/sso.html
VITE_RIPPLIFY_URL=http://localhost:8080
VITE_ADMIN_URL=http://localhost:8083

# admin/.env.local (optional, for admin panel)
VITE_API_URL=http://localhost:3005/api
VITE_SSO_URL=http://localhost:3001/sso.html
```

### Step 3: Start Backend

**Option A: Monolith (single server)**

```bash
cd server
node index.js
# Server runs on http://localhost:3001
```

**Option B: Microservices (split architecture)**

```bash
# Terminal 1 - Auth Service
cd services/auth-service && node index.js    # Port 3001

# Terminal 2 - Ripplify Service
cd services/ripplify-service && node index.js # Port 3002

# Terminal 3 - Admin Service
cd services/admin-service && node index.js   # Port 3005

# Terminal 4 - Watchtower Service
cd services/watchtower-service && node index.js # Port 3004
```

### Step 4: Start Frontends

```bash
# Terminal 1 - Ripplify Seller Dashboard
cd ripplify
npm run dev
# Opens at http://localhost:8080
# Admin routes available at http://localhost:8080/admin

# Terminal 2 - Standalone Admin Panel
cd admin
npm run dev
# Opens at http://localhost:8083
# Full admin panel with project switcher sidebar
```

### Step 5: Access the Application

| URL | Description |
|-----|-------------|
| `http://localhost:8080` | Ripplify seller dashboard |
| `http://localhost:8080/admin` | Admin panel (embedded in ripplify) |
| `http://localhost:8083` | Standalone admin panel |
| `http://localhost:3001/health` | Backend health check |

### Building for Production (Local)

```bash
# Build all frontends
npm run build:all

# Or individually
cd ripplify && npm run build    # Output: ripplify/dist/
cd admin && npm run build       # Output: admin/dist/

# Preview built frontends
cd ripplify && npm run preview  # http://localhost:8080
cd admin && npm run preview     # http://localhost:8083
```

---

## Frontend Deployment (Vercel)

### Ripplify Dashboard

1. **Connect Repository**: Go to [vercel.com](https://vercel.com) → Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `ripplify`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables** (set in Vercel dashboard):
   ```
   VITE_API_URL=https://ripplify.sokostack.xyz/api
   VITE_SSO_URL=https://auth.sokostack.xyz/sso.html
   VITE_RIPPLIFY_URL=https://ripplify.sokostack.xyz
   VITE_SHOPALIZE_URL=https://shopalize.sokostack.xyz
   VITE_WATCHTOWER_URL=https://watchtower.sokostack.xyz
   VITE_ADMIN_URL=https://admin.sokostack.xyz
   ```

4. **Custom Domain**: Add `ripplify.sokostack.xyz` in Vercel domain settings

5. **SPA Routing**: Create `vercel.json` in ripplify root:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

### Standalone Admin Panel

1. **Connect Repository**: Import same repo, different project

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `admin`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**:
   ```
   VITE_API_URL=https://admin.sokostack.xyz/api
   VITE_SSO_URL=https://auth.sokostack.xyz/sso.html
   VITE_RIPPLIFY_URL=https://ripplify.sokostack.xyz
   VITE_SHOPALIZE_URL=https://shopalize.sokostack.xyz
   VITE_WATCHTOWER_URL=https://watchtower.sokostack.xyz
   VITE_ADMIN_URL=https://admin.sokostack.xyz
   ```

4. **Custom Domain**: Add `admin.sokostack.xyz`

5. **vercel.json**:
   ```json
   {
     "rewrites": [{ "source": "/((?!api).*)", "destination": "/index.html" }]
   }
   ```

### Shopalize & Watchtower

Same process as above with their respective root directories and domains:
- `shopalize` → `shopalize.sokostack.xyz`
- `insights` → `watchtower.sokostack.xyz`

### Vercel CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy ripplify
cd ripplify
vercel --prod

# Deploy admin
cd admin
vercel --prod
```

---

## Backend Deployment (VPS)

### Server Requirements

- Ubuntu 22.04 LTS (or similar)
- Node.js v22+ 
- PostgreSQL 15+
- Nginx
- PM2
- Certbot (for SSL)

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js v22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE USER sokostack WITH PASSWORD 'your_secure_password';
CREATE DATABASE ripplify OWNER sokostack;
GRANT ALL PRIVILEGES ON DATABASE ripplify TO sokostack;
\q

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Deploy Application

```bash
# Clone repository
cd /var/www
git clone <your-repo-url> ripplify
cd ripplify

# Install backend dependencies
cd server && npm install --production && cd ..

# Install service dependencies
cd services/auth-service && npm install --production && cd ../..
cd services/ripplify-service && npm install --production && cd ../..
cd services/admin-service && npm install --production && cd ../..
cd services/watchtower-service && npm install --production && cd ../..

# Install frontend dependencies & build
cd ripplify && npm install && npm run build && cd ..
cd admin && npm install && npm run build && cd ..

# Create .env from template
cp .env.example .env
nano .env  # Edit with production values
```

### Step 3: Configure Production Environment

```env
# .env (production)
PG_HOST=localhost
PG_PORT=5432
PG_USER=sokostack
PG_PASSWORD=your_secure_production_password

JWT_SECRET=your-64-char-random-secret-here
INTERNAL_API_KEY=your-internal-api-key

AUTH_SERVICE_URL=http://127.0.0.1:3001
RIPPLIFY_SERVICE_URL=http://127.0.0.1:3002
SHOPALIZE_SERVICE_URL=http://127.0.0.1:3003
WATCHTOWER_SERVICE_URL=http://127.0.0.1:3004
ADMIN_SERVICE_URL=http://127.0.0.1:3005

FRONTEND_URL=https://ripplify.sokostack.xyz
CORS_ORIGINS=https://ripplify.sokostack.xyz,https://shopalize.sokostack.xyz,https://watchtower.sokostack.xyz,https://admin.sokostack.xyz,https://auth.sokostack.xyz

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

INTASEND_API_KEY=your_key
INTASEND_PUBLISHABLE_KEY=your_key

NODE_ENV=production
```

### Step 4: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start all services
pm2 start ecosystem.config.cjs

# Verify all processes are running
pm2 status

# Setup PM2 to start on boot
pm2 startup systemd
pm2 save

# Monitor logs
pm2 logs --lines 50
```

### PM2 Commands Reference

```bash
pm2 start ecosystem.config.cjs     # Start all
pm2 stop ecosystem.config.cjs      # Stop all
pm2 restart ecosystem.config.cjs   # Restart all
pm2 reload ecosystem.config.cjs    # Zero-downtime reload
pm2 delete ecosystem.config.cjs    # Remove all
pm2 status                         # Process status
pm2 logs                           # Stream logs
pm2 monit                          # Real-time monitor
```

---

## Nginx & SSL Configuration

### Copy Nginx Config

```bash
# Copy our config
sudo cp nginx/ecosystem.conf /etc/nginx/sites-enabled/

# Copy SSL params
sudo cp nginx/options-ssl-nginx.conf /etc/letsencrypt/

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### Setup SSL (One-time)

```bash
# Run the automated SSL setup script
sudo bash nginx/setup-ssl.sh
```

Or manually:

```bash
# Create webroot directory
sudo mkdir -p /var/www/certbot/.well-known/acme-challenge

# Get certificate (wildcard for *.sokostack.xyz)
sudo certbot certonly --nginx \
  -d sokostack.xyz \
  -d "*.sokostack.xyz" \
  --email admin@sokostack.xyz \
  --agree-tos --non-interactive

# Setup auto-renewal
echo "0 3 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'" | sudo crontab -
```

### Nginx Architecture

```
                    Internet
                       │
                   ┌───┴───┐
                   │ Nginx │  (SSL termination)
                   │ :443  │
                   └───┬───┘
                       │
        ┌──────────────┼──────────────┐──────────────┐
        │              │              │              │
   auth.sokostack  ripplify.sokostack  admin.sokostack  ...
        │              │              │
   :3001 (auth)   :3002 (ripplify) :3005 (admin)
                  :8080 (frontend) :8083 (frontend)
```

Each subdomain routes to both a backend API and a frontend:
- `/api/*` → backend service
- `/*` → frontend (Vite preview or static files)

---

## PM2 Process Management

### Process Map

| Process Name | Type | Port | Description |
|---|---|---|---|
| `auth-service` | Backend | 3001 | Authentication & SSO |
| `ripplify-service` | Backend | 3002 | Payment links, transactions |
| `shopalize-service` | Backend | 3003 | E-commerce storefront |
| `watchtower-service` | Backend | 3004 | Analytics & tracking |
| `admin-service` | Backend | 3005 | Admin API |
| `ripplify-frontend` | Frontend | 8080 | Seller dashboard |
| `shopalize-frontend` | Frontend | 8081 | Storefront |
| `watchtower-frontend` | Frontend | 8082 | Analytics dashboard |
| `admin-frontend` | Frontend | 8083 | Admin panel |

### Log Files

All logs are written to `./logs/`:
```
logs/
├── auth-service-error.log
├── auth-service-out.log
├── ripplify-service-error.log
├── ripplify-service-out.log
├── admin-frontend-error.log
├── admin-frontend-out.log
└── ... (one pair per process)
```

### Deployment Script

```bash
# Full rebuild and redeploy
npm run deploy:all

# Or step by step
npm run build:all           # Build all frontends
pm2 reload ecosystem.config.cjs  # Zero-downtime reload
```

---

## Admin Panel Features

The standalone admin panel (`admin/`) has **full feature parity** with the admin routes in the ripplify dashboard (`ripplify/src/pages/admin/`). All 15 pages are available:

### Dashboard (`/`)
- Platform stats cards (Revenue, Volume, Sellers, Transactions, etc.)
- Revenue trend chart (30 days)
- Transaction volume bar chart
- User growth area chart
- Transaction status pie chart
- Top sellers list
- Quick shortcut buttons

### Analytics (`/analytics`)
- Period selector (7d, 30d, 90d, 1y)
- Month-over-month comparison cards
- Revenue & fee trend dual chart
- Transaction volume chart
- User growth (new users vs new sellers)
- Payout activity trend
- Transfer activity trend
- Transaction status breakdown (pie)
- Currency breakdown (pie)
- User statistics panel
- Top sellers by revenue table

### User Management (`/users`)
- Search & filter by status (verified, unverified, disabled, suspended)
- User table with contact, KYC/KYB status, roles
- View user details modal (stats, API keys, limits)
- Edit user profile (name, phone, business, location, payout method, KYC/KYB)
- Add new user (with legacy role + RBAC role)
- Verify / unverify accounts
- Enable / disable accounts
- Suspend / unsuspend with reason
- Delete users permanently
- Manage user RBAC roles (assign, revoke, scope, expiration)
- Manage per-user feature flags

### Company Management (`/companies`)
- Search & filter companies
- Company table with owner, verification, revenue, fees
- Add new company
- Edit company details (name, owner, phone, location, payout, KYC/KYB, transaction limit)
- Verify / disable / delete companies

### Roles & Permissions (`/roles`)
- RBAC role list with system badge
- Create new role with name, description, parent role (inheritance)
- Configure role permissions by category domain
- Permission catalog stats
- Delete (deprecate) roles

### Transactions (`/transactions`)
- Category filter cards (All, Payments, Payouts, Transfers)
- Status filter buttons (Completed, Pending, Disputed)
- Search by transaction ID, seller, buyer
- Transaction table with ID, category, seller, buyer, amount, fee, status, date
- Refresh button

### Payouts (`/payouts`)
- Payout request table
- Seller info, amount, fee, method (M-Pesa / Bank), details
- Bank name resolution (KCB, Equity, Co-operative, etc.)
- Mark as Completed / Failed actions

### API Keys (`/api-keys`)
- API key list with company association
- Generate new key for a company
- Copy key to clipboard
- Suspend / activate keys
- Revoke (delete) keys

### Referral Codes (`/referrals`)
- Create referral codes (code, points, max uses, expiration, assign to user)
- Random code generator
- Copy referral link
- View usage/registration history modal
- Toggle active/inactive
- Delete codes

### System Settings (`/settings`)
- Fee configuration (flat % or tiered pricing)
- Tiered fee editor (add/remove tiers with min/max/percent)
- Min withdrawal amount
- Escrow period (days)
- Other dynamic settings
- Payout configuration summary panel

### Feature Flags (`/features`)
- Stats (total, enabled, disabled)
- Search & filter by category
- Toggle features on/off
- Create new feature flag (key, name, description, category)
- Delete feature flags

### App Management (`/apps`)
- App list with slug, URL, status
- Activate / deactivate apps
- Delete apps

### Support Tickets (`/support`)
- Ticket list with user details, subject, message preview
- View full message modal
- Mark as resolved

### Notifications (`/notifications`)
- Create notification form (target user/role, delivery channel: App/SMS/Both, type, title, message, action link)
- Notification history with type icons, read status, delivery channel badges
- Mark as read / mark all as read
- Delete notifications

### Project Switcher Sidebar
- Admin panel logo + "Admin Panel" badge
- Dropdown project switcher showing Ripplify, Shopalize, Watchtower links (opens in new tabs)
- Collapsible navigation groups
- Notification bell with unread count
- Admin badge + sign out

---

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|---|---|---|
| `PG_HOST` | PostgreSQL host | `localhost` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_USER` | Database user | `sokostack` |
| `PG_PASSWORD` | Database password | `secure_password` |
| `JWT_SECRET` | JWT signing secret | `64-char-random-string` |
| `INTERNAL_API_KEY` | Service-to-service auth | `random-api-key` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://127.0.0.1:3001` |
| `RIPPLIFY_SERVICE_URL` | Ripplify service URL | `http://127.0.0.1:3002` |
| `ADMIN_SERVICE_URL` | Admin service URL | `http://127.0.0.1:3005` |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_USER` | Email username | `your@gmail.com` |
| `SMTP_PASS` | Email password | `app-password` |
| `CORS_ORIGINS` | Allowed CORS origins | Comma-separated URLs |
| `FRONTEND_URL` | Main frontend URL | `https://ripplify.sokostack.xyz` |
| `INTASEND_API_KEY` | IntaSend payment key | Your key |
| `NODE_ENV` | Environment | `production` |

### Frontend (VITE_* variables)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `https://ripplify.sokostack.xyz/api` |
| `VITE_SSO_URL` | SSO hub URL | `https://auth.sokostack.xyz/sso.html` |
| `VITE_RIPPLIFY_URL` | Ripplify frontend URL | `https://ripplify.sokostack.xyz` |
| `VITE_SHOPALIZE_URL` | Shopalize frontend URL | `https://shopalize.sokostack.xyz` |
| `VITE_WATCHTOWER_URL` | Watchtower frontend URL | `https://watchtower.sokostack.xyz` |
| `VITE_ADMIN_URL` | Admin frontend URL | `https://admin.sokostack.xyz` |

---

## Troubleshooting

### Services won't start
```bash
# Check PM2 logs for errors
pm2 logs --lines 100

# Check if ports are in use
sudo lsof -i :3001
sudo lsof -i :3002
sudo lsof -i :8080
sudo lsof -i :8083

# Restart specific service
pm2 restart auth-service
```

### Nginx 502 Bad Gateway
```bash
# Verify backend is running
curl http://127.0.0.1:3001/health
curl http://127.0.0.1:3005/health

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -servername ripplify.sokostack.xyz -connect ripplify.sokostack.xyz:443 2>/dev/null | openssl x509 -noout -dates
```

### Frontend build fails
```bash
# Clear node_modules and reinstall
cd ripplify  # or admin
rm -rf node_modules package-lock.json
npm install
npm run build
```

### SSO not syncing between apps
- Ensure all frontends point to the same `VITE_SSO_URL`
- Verify the auth service is running on port 3001
- Check browser console for CORS errors
- Ensure `CORS_ORIGINS` includes all frontend domains

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U sokostack -d ripplify

# If using Docker PostgreSQL
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
```

---

## Quick Command Reference

```bash
# Development
npm run dev:ripplify          # Start ripplify frontend
npm run dev:admin             # Start admin frontend

# Building
npm run build:all             # Build all frontends
npm run build:ripplify        # Build ripplify only
npm run build:admin           # Build admin only

# PM2
npm run pm2:start             # Start all services
npm run pm2:stop              # Stop all services
npm run pm2:restart           # Restart all services
npm run pm2:reload            # Zero-downtime reload
npm run pm2:status            # Show process status
npm run pm2:logs              # Tail all logs

# Deployment
npm run deploy:all            # Build + reload PM2
npm run deploy:nginx          # Copy Nginx config + reload
npm run deploy:ssl            # Setup SSL certificates

# Testing
npm run test:health           # Run deployment health check
```
