# ScamShield Deployment Guide

## Production Deployment on Render

### Prerequisites
- Render account (free tier available)
- GitHub repository with this code
- MySQL database (can use Render's managed MySQL or external provider)

### Environment Variables Required

Set these in your Render dashboard:

**Required:**
- `NODE_ENV` = `production`
- `PORT` = `10000` (Render's default port)
- `DATABASE_URL` = Your MySQL connection string (e.g., `mysql://user:password@host:3306/database`)
- `VITE_APP_ID` = Your OAuth application ID
- `JWT_SECRET` = Strong random secret for session signing (auto-generated if not set)
- `OAUTH_SERVER_URL` = Your OAuth server URL
- `VITE_OAUTH_PORTAL_URL` = Your OAuth portal URL
- `OWNER_OPEN_ID` = Your owner's openId for admin role

### Deployment Steps

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Production deployment configuration"
   git push origin main
   ```

2. **Create MySQL Database**
   - Option A: Use Render's managed MySQL (add via Render dashboard)
   - Option B: Use external MySQL provider (PlanetScale, AWS RDS, etc.)
   - Get your DATABASE_URL connection string

3. **Deploy to Render**
   - Go to render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml` configuration
   - Fill in the required environment variables
   - Click "Deploy Web Service"

4. **Database Migration**
   - The application will auto-create tables on first startup
   - Or manually run: `pnpm run db:migrate`

### Verification

After deployment, test:
- Health check: `https://your-app.onrender.com/health`
- Homepage: `https://your-app.onrender.com/`
- API: `https://your-app.onrender.com/api/trpc/system.health`

### Architecture

- **Frontend**: React 19 + Vite (bundled with backend)
- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL with Drizzle ORM
- **ML Service**: Not required (analysis is rule-based in TypeScript)
- **Hosting**: Render (Web Service + optional MySQL)

### ML Service Note

The `ml_service/` directory contains only `requirements.txt` but no Python code. The scam analysis is implemented entirely in `server/scamAnalyzer.ts` using deterministic rule-based pattern matching. No separate ML service deployment is needed.

### Troubleshooting

**Build fails:**
- Check that all environment variables are set
- Verify DATABASE_URL format
- Check Render build logs

**Database connection fails:**
- Verify DATABASE_URL is correct
- Check database allows connections from Render's IP
- Ensure database user has proper permissions

**OAuth fails:**
- Verify OAUTH_SERVER_URL and VITE_OAUTH_PORTAL_URL
- Check VITE_APP_ID matches your OAuth app
- Ensure redirect URI includes your Render domain
