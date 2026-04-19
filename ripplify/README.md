# Ripplify

A unified business software suite built with modern web technologies.

## Overview

Ripplify is an all-in-one business software platform offering 55+ applications for sales, marketing, finance, HR, collaboration, analytics, and more.

## Packages

| Package | Description |
|---------|-------------|
| `admin` | Admin dashboard for platform management |
| `forms` | Form builder and response management |
| `insights` | Analytics and reporting platform |
| `ripplify` | Main web application |
| `shopalize` | E-commerce solution |
| `sokostack` | Landing page |
| `services/auth-service` | Authentication service |

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: (configurable)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies for all packages
npm install

# Or using pnpm
pnpm install
```

### Development

```bash
# Run the main app
cd ripplify
npm run dev

# Run admin dashboard
cd admin
npm run dev

# Run forms
cd forms
npm run dev

# Run insights
cd insights
npm run dev

# Run shopalize
cd shopalize
npm run dev

# Run auth service
cd services/auth-service
npm run dev
```

## Features

- **CRM** - Customer relationship management
- **Forms** - Build and manage forms
- **Analytics** - Business intelligence and reporting
- **E-commerce** - Online store management
- **Authentication** - Secure user authentication

## License

MIT
