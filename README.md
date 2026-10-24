# Sentra - AI Scam Detection Platform

An AI-powered universal scam detection and verification system built with React, Node.js, and MySQL.

## Features

- **Multi-Input Scanner**: Analyze messages, websites, emails, screenshots, and more
- **Risk Analysis**: 0-100 risk scores with detailed explanations
- **Scan History**: Track your analysis history
- **Community Reports**: Contribute to community threat intelligence
- **Dashboard**: Overview of scans, threats blocked, and activity

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth with JWT sessions
- **Deployment**: Render (configured)

## Quick Start

### Local Development

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables (copy `.env.example` to `.env`):
```bash
cp .env.example .env
```

3. Start development server:
```bash
pnpm run dev
```

The app will be available at `http://localhost:3000`

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions on Render.

## Environment Variables

Required for production:

- `NODE_ENV` - `production`
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - MySQL connection string
- `VITE_APP_ID` - OAuth application ID
- `JWT_SECRET` - Session signing secret
- `OAUTH_SERVER_URL` - OAuth server URL
- `VITE_OAUTH_PORTAL_URL` - OAuth portal URL
- `OWNER_OPEN_ID` - Owner's openId for admin role

## Database

The app uses MySQL with the following tables:

- `users` - User accounts and authentication
- `scamScans` - Scan history and results
- `communityReports` - Community threat reports

Database migrations are handled via Drizzle Kit.

## Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run check` - TypeScript type checking
- `pnpm run db:generate` - Generate database migrations
- `pnpm run db:migrate` - Run database migrations
- `pnpm run test` - Run tests

## License

MIT
