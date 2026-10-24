# Sentra - Deployment Guide

## Deployment on Render

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- pnpm package manager

### Step 1: Prepare Your Repository
Ensure your repository includes:
- ✅ `render.yaml` configuration file
- ✅ `package.json` with correct scripts
- ✅ `.env.example` for environment variables
- ✅ All code committed and pushed to GitHub

### Step 2: Deploy on Render

1. **Connect Your GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (usually `main`)

2. **Configure Build Settings**
   - **Runtime**: Node
   - **Build Command**: `pnpm install --frozen-lockfile && pnpm run build`
   - **Start Command**: `pnpm run start`
   - **Node Version**: 18 or higher

3. **Configure Environment Variables**
   Render will automatically detect these from `render.yaml`:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `SCALING_ENABLED` = `false`
   
   Optional variables (configure in Render dashboard):
   - `OAUTH_SERVER_URL` (for OAuth authentication)
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (for MySQL)
   - `REDIS_URL` (for Redis caching)

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete (~2-3 minutes)
   - Your app will be live at `https://sentra-scam-detector.onrender.com`

### Step 3: Post-Deployment

1. **Test Your Deployment**
   - Visit your Render URL
   - Check if the landing page loads
   - Test scam detection functionality
   - Verify all 12 scam categories work

2. **Monitor Logs**
   - Go to Render Dashboard → Your Service → Logs
   - Check for any runtime errors
   - Monitor server startup logs

3. **Set Up Automatic Deploys**
   - Render auto-deploys on push to main branch
   - Changes to `render.yaml` require manual redeploy

## Environment Variables

### Required (Auto-configured)
- `NODE_ENV` = `production`
- `PORT` = `10000`
- `SCALING_ENABLED` = `false`

### Optional (Configure in Render Dashboard)
- `OAUTH_SERVER_URL` - OAuth server URL for authentication
- `DB_HOST` - MySQL database host
- `DB_PORT` - MySQL database port (default: 3306)
- `DB_USER` - MySQL database user
- `DB_PASSWORD` - MySQL database password
- `DB_NAME` - MySQL database name
- `REDIS_URL` - Redis connection URL

## Troubleshooting

### Build Fails
- Check Node version (must be >= 18)
- Verify `pnpm-lock.yaml` exists
- Check package.json scripts

### Runtime Errors
- Check Render logs for errors
- Verify PORT is set to 10000
- Ensure all dependencies are installed

### White Screen
- Check browser console for errors
- Verify build completed successfully
- Check server logs for startup errors

### Database Connection Errors
- Database is optional for basic functionality
- App works with in-memory fallback
- Configure DB variables if you need persistence

## Production Optimizations

### Free Tier Limitations
- 512 MB RAM
- Shared CPU
- Free SSL certificate
- 750 hours/month

### Upgrade Recommendations
- For higher traffic, upgrade to Starter plan
- Add PostgreSQL for data persistence
- Add Redis for better caching
- Configure custom domain

## Health Check

Your deployment includes a health check endpoint:
```
https://your-app-url.onrender.com/health
```

This returns:
- Server status
- WebSocket stats
- Database health
- Scaling information
- Memory usage
- Uptime

## Support

For issues:
1. Check Render logs
2. Review this guide
3. Check GitHub issues
4. Contact Render support

## Local Production Build

To test production build locally:
```bash
pnpm run build
pnpm run start
```

This mimics the Render production environment.
