# Deployment Strategy

**Document Version:** 1.0
**Last Updated:** 2025-12-01
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Deployment Requirements](#deployment-requirements)
3. [Platform Comparison](#platform-comparison)
4. [Recommended Strategy](#recommended-strategy)
5. [Step-by-Step Deployment Guide](#step-by-step-deployment-guide)
6. [Environment Configuration](#environment-configuration)
7. [Database Migration Strategy](#database-migration-strategy)
8. [OAuth Configuration](#oauth-configuration)
9. [Post-Deployment Checklist](#post-deployment-checklist)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Cost Estimates](#cost-estimates)
12. [Scaling Strategy](#scaling-strategy)
13. [Rollback Procedures](#rollback-procedures)
14. [Appendix](#appendix)

---

## Executive Summary

This document outlines the deployment strategy for the Fitness Tracker application, a full-stack TypeScript application consisting of:

- **Frontend**: React + Vite SPA (TypeScript, Chakra UI)
- **Backend**: Express.js API server (TypeScript, Node.js 22.18.0)
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: Google OAuth 2.0 with PostgreSQL-backed sessions

### Recommended Approach

**For MVP Stage (Current):**
- **Frontend**: Vercel (free tier, optimized for React/Vite)
- **Backend**: Railway (usage-based pricing, ideal for Express.js)
- **Database**: Railway PostgreSQL (co-located with backend for low latency)

**Rationale**: This combination provides the best balance of cost-effectiveness, developer experience, and production readiness for an MVP. Total estimated cost: $5-15/month.

---

## Deployment Requirements

### Application Requirements

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Node.js | v22.18.0 | Backend runtime |
| PostgreSQL | v15+ | Primary database |
| HTTPS | Required | Google OAuth mandate |
| Persistent Storage | Required | PostgreSQL sessions |
| Long-running Process | Required | Express server |
| Static Asset Hosting | Required | React SPA |

### Security Requirements

| Requirement | Description |
|-------------|-------------|
| SSL/TLS | HTTPS for all traffic (OAuth requirement) |
| Session Cookies | `httpOnly`, `secure`, `sameSite: 'lax'` |
| CSRF Protection | Double Submit Cookie pattern |
| CORS | Strict origin validation |
| Environment Variables | Secure storage for secrets |

### Performance Requirements

| Metric | Target |
|--------|--------|
| API Response Time | < 500ms (p95) |
| Frontend Load Time | < 3s on 3G |
| Lighthouse Mobile | > 90% usability |
| Database Connection | < 10ms latency |
| Uptime | 99.5% |

---

## Platform Comparison

### Backend Hosting Platforms

#### Railway

| Aspect | Details |
|--------|---------|
| **Pricing Model** | Usage-based ($0.000463/vCPU minute, $0.000231/GB memory minute) |
| **Minimum Cost** | ~$5/month (Hobby) |
| **Free Tier** | $5 one-time trial credit |
| **Node.js Support** | Excellent (auto-detects, supports v22) |
| **PostgreSQL** | Native integration, managed |
| **Long-running Processes** | Full support |
| **Custom Domains** | Included with HTTPS |
| **Deploy Method** | GitHub integration, CLI, Docker |

**Pros:**
- Usage-based billing (pay for what you use)
- Native PostgreSQL with low latency
- Excellent monorepo support
- Auto-scaling built-in
- GitHub integration with auto-deploy

**Cons:**
- Can be unpredictable cost at scale
- Smaller community than Heroku
- No free tier (only trial credit)

#### Render

| Aspect | Details |
|--------|---------|
| **Pricing Model** | Instance-based (fixed monthly) |
| **Minimum Cost** | ~$7/month (Starter) |
| **Free Tier** | 750 hours/month (spins down after 15 min inactivity) |
| **Node.js Support** | Excellent |
| **PostgreSQL** | Free tier: 1GB, 256MB RAM |
| **Long-running Processes** | Full support |
| **Custom Domains** | Included with HTTPS |
| **Deploy Method** | GitHub integration |

**Pros:**
- Predictable pricing
- Free PostgreSQL tier (1GB)
- Background workers and cron jobs
- Websocket support
- Private networking

**Cons:**
- Free tier spins down (cold starts)
- Higher base cost than Railway for low usage
- Less flexible than usage-based

#### Vercel (for Backend)

| Aspect | Details |
|--------|---------|
| **Pricing Model** | Serverless (per execution) |
| **Minimum Cost** | Free tier available, Pro at $20/month |
| **Node.js Support** | Serverless functions only |
| **Long-running Processes** | NOT supported |
| **Database** | External only (Neon, Supabase) |

**NOT Recommended for this project** because:
- Express.js with sessions requires long-running processes
- PostgreSQL session store needs persistent connections
- Serverless cold starts affect UX
- OAuth callback complexity increases

### Frontend Hosting Platforms

#### Vercel (Recommended)

| Aspect | Details |
|--------|---------|
| **Pricing** | Free tier generous (100GB bandwidth) |
| **Vite Support** | Native, optimized |
| **Build Performance** | Excellent |
| **CDN** | Global edge network |
| **Custom Domains** | Free with HTTPS |
| **Deploy Method** | GitHub integration |

**Pros:**
- Best-in-class for React/Vite
- Zero-config deployment
- Excellent preview deployments
- Built-in analytics (free tier)

**Cons:**
- $20/month to upgrade
- Bandwidth limits on free tier

#### Netlify

| Aspect | Details |
|--------|---------|
| **Pricing** | Free tier: 100GB bandwidth |
| **Vite Support** | Good |
| **CDN** | Global |
| **Custom Domains** | Free with HTTPS |

**Pros:**
- Similar to Vercel for static sites
- Good forms/functions support
- Generous free tier

**Cons:**
- Slightly slower builds than Vercel
- Less React-optimized

### Database Hosting

#### Railway PostgreSQL (Recommended)

| Aspect | Details |
|--------|---------|
| **Pricing** | Usage-based (included in backend cost) |
| **Version** | PostgreSQL 15, 16, 17 available |
| **Storage** | Scales automatically |
| **Backups** | Automatic (point-in-time recovery on Pro) |
| **Latency** | < 5ms when co-located with backend |

**Pros:**
- Same platform as backend (simplicity)
- Low latency
- Managed backups
- Easy connection

**Cons:**
- No free tier

#### Render PostgreSQL

| Aspect | Details |
|--------|---------|
| **Free Tier** | 1GB storage, 256MB RAM, 0.1 CPU |
| **Paid Plans** | Start at ~$7/month |
| **Backups** | Manual on free tier |

**Pros:**
- True free tier
- Sufficient for MVP

**Cons:**
- Limited resources on free tier
- Higher latency if backend on different platform

#### Supabase PostgreSQL

| Aspect | Details |
|--------|---------|
| **Free Tier** | 500MB storage, 2 projects |
| **Pause Policy** | Pauses after 1 week inactivity |
| **Additional Features** | Auth, Realtime, Storage included |

**Pros:**
- Generous free tier
- Additional features if needed

**Cons:**
- Pauses on inactivity (cold start issue)
- May have higher latency
- Feature overlap with our auth system

---

## Recommended Strategy

### MVP Architecture

```
                                     [Internet]
                                         |
                    +--------------------+--------------------+
                    |                                         |
              [Vercel CDN]                            [Railway Backend]
                    |                                         |
         [React SPA - Static]                     [Express.js API Server]
                    |                                         |
                    +---------[API Requests]------------------+
                                         |
                              [Railway PostgreSQL]
                                         |
                              [Session Store + Data]
```

### Component Deployment

| Component | Platform | Plan | Estimated Cost |
|-----------|----------|------|----------------|
| Frontend | Vercel | Free/Hobby | $0/month |
| Backend | Railway | Pro | ~$5-10/month |
| Database | Railway | Included | ~$3-5/month |
| **Total** | | | **$5-15/month** |

### Why This Stack?

1. **Vercel for Frontend**:
   - Zero-config Vite deployment
   - Global CDN for fast asset delivery
   - Free preview deployments for PRs
   - Excellent developer experience

2. **Railway for Backend**:
   - Long-running Express.js server support
   - Native PostgreSQL integration
   - Low latency between API and database
   - Usage-based pricing optimal for MVP traffic

3. **Railway PostgreSQL**:
   - Co-location with backend minimizes latency
   - Managed backups and maintenance
   - Easy scaling as needed
   - Single platform simplifies operations

---

## Step-by-Step Deployment Guide

### Prerequisites

Before starting deployment:

- [ ] GitHub repository with latest code
- [ ] Google Cloud Console project with OAuth configured
- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)
- [ ] Custom domain (optional but recommended)

### Phase 1: Railway Backend Deployment

#### Step 1.1: Create Railway Project

```bash
# Install Railway CLI (optional, can use web dashboard)
npm install -g @railway/cli

# Login to Railway
railway login
```

Or use the web dashboard at https://railway.app:

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub
4. Select the `fitness_tracker` repository

#### Step 1.2: Configure Railway PostgreSQL

1. In Railway dashboard, click "+ New" in your project
2. Select "Database" -> "PostgreSQL"
3. Wait for provisioning (usually < 30 seconds)
4. Note the connection details (or use Railway's auto-injection)

#### Step 1.3: Configure Backend Service

1. Click "+ New" -> "GitHub Repo" (if not already connected)
2. Configure the service:

**Settings Tab:**
- **Root Directory**: `packages/backend`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

**Variables Tab (add all):**

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://YOUR_RAILWAY_DOMAIN/api/auth/google/callback
SESSION_SECRET=generate_a_new_32_character_random_string
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

Generate a session secret:
```bash
openssl rand -base64 32
```

#### Step 1.4: Configure Custom Domain (Recommended)

1. Go to Settings -> Domains
2. Add a custom domain (e.g., `api.yourapp.com`)
3. Configure DNS at your registrar:
   - Type: CNAME
   - Name: api (or your subdomain)
   - Value: Railway's provided CNAME target

Or use Railway's generated domain:
- Format: `your-service-name.up.railway.app`
- Note: Google OAuth may have issues with changing Railway domains

#### Step 1.5: Deploy Backend

1. Railway auto-deploys on push to main branch
2. Or manually trigger: "Deploy" button in dashboard
3. Monitor logs for successful startup:

Expected output:
```
Server running on port 3000 in production mode
Database: connected
CORS enabled for: https://your-frontend-domain.vercel.app
Security headers enabled via Helmet
```

#### Step 1.6: Run Database Migrations

Option A: Using Railway CLI
```bash
# Connect to your project
railway link

# Run migrations
railway run npx prisma migrate deploy

# Seed the database
railway run npx prisma db seed
```

Option B: Using Railway Shell
1. Click on your backend service
2. Go to "Shell" tab
3. Run:
```bash
cd packages/backend
npx prisma migrate deploy
npx prisma db seed
```

### Phase 2: Vercel Frontend Deployment

#### Step 2.1: Create Vercel Project

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:

**Build & Development Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `packages/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### Step 2.2: Configure Environment Variables

In Vercel dashboard, add:

```
VITE_API_URL=https://your-railway-backend-domain.up.railway.app
```

Or if using custom domain:
```
VITE_API_URL=https://api.yourapp.com
```

#### Step 2.3: Configure Vercel for SPA Routing

Create `packages/frontend/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures React Router handles all routes.

#### Step 2.4: Deploy Frontend

1. Vercel auto-deploys on push to main
2. Wait for build to complete (~1-2 minutes)
3. Note the production URL

#### Step 2.5: Configure Custom Domain (Optional)

1. Go to Settings -> Domains
2. Add your domain (e.g., `app.yourapp.com` or `yourapp.com`)
3. Configure DNS:
   - For apex domain: A record pointing to Vercel's IP
   - For subdomain: CNAME to `cname.vercel-dns.com`

### Phase 3: Connect Frontend to Backend

#### Step 3.1: Update CORS Origin

In Railway, update the backend environment variable:

```
CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

Or with custom domain:
```
CORS_ORIGIN=https://app.yourapp.com
```

#### Step 3.2: Verify API Connection

1. Open frontend in browser
2. Open DevTools -> Network tab
3. Verify API calls to `/api/health` succeed
4. Check for CORS errors (should be none)

---

## Environment Configuration

### Production Environment Variables

#### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | Auto-injected by Railway |
| `GOOGLE_CLIENT_ID` | OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | `GOCSPX-xxxx` |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | `https://api.yourapp.com/api/auth/google/callback` |
| `SESSION_SECRET` | Session encryption key | 32+ character random string |
| `CORS_ORIGIN` | Allowed frontend origin | `https://app.yourapp.com` |

#### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourapp.com` |

### Environment File Templates

#### .env.production (Backend Reference)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database (Railway auto-injects DATABASE_URL)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://api.yourapp.com/api/auth/google/callback

# Session
SESSION_SECRET=your_32_char_random_string_here

# CORS
CORS_ORIGIN=https://app.yourapp.com
```

### Secret Generation

```bash
# Generate SESSION_SECRET
openssl rand -base64 32

# Example output: k8+Zf3K9x2J7mN4pQ1wR6yT0vU5sA8dL
```

---

## Database Migration Strategy

### Initial Production Setup

```bash
# From local machine with Railway CLI
railway link
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

### Subsequent Migrations

1. **Development**: Create migration locally
   ```bash
   cd packages/backend
   npx prisma migrate dev --name description
   ```

2. **Testing**: Test migration on staging (if available)

3. **Production**: Deploy migration
   ```bash
   railway run npx prisma migrate deploy
   ```

### Migration Best Practices

- **Always backup before migrations**: Railway Pro includes point-in-time recovery
- **Test migrations locally first**: Use a copy of production data if possible
- **Keep migrations reversible**: Add corresponding rollback steps
- **Deploy during low-traffic periods**: Minimize user impact

### Emergency Rollback

If a migration fails:

```bash
# Check migration status
railway run npx prisma migrate status

# Rollback to previous state (if migration was applied)
# Note: Prisma doesn't have built-in rollback; manual SQL may be needed
railway run psql -c "DROP TABLE new_table_if_exists;"
```

---

## OAuth Configuration

### Google Cloud Console Setup

1. **Go to**: https://console.cloud.google.com/apis/credentials

2. **Update OAuth Client**:
   - Add authorized redirect URI:
     ```
     https://api.yourapp.com/api/auth/google/callback
     ```
   - Keep development URI for local testing:
     ```
     http://localhost:3000/api/auth/google/callback
     ```

3. **Verify Domain Ownership** (if using custom domain):
   - Google may require domain verification
   - Add verification TXT record to DNS

### OAuth Flow in Production

```
User clicks "Continue with Google"
         |
         v
Frontend redirects to:
  https://api.yourapp.com/api/auth/google
         |
         v
Backend redirects to Google OAuth:
  https://accounts.google.com/o/oauth2/v2/auth
         |
         v
User authenticates with Google
         |
         v
Google redirects to:
  https://api.yourapp.com/api/auth/google/callback
         |
         v
Backend creates session, redirects to:
  https://app.yourapp.com/
```

### Troubleshooting OAuth

| Issue | Solution |
|-------|----------|
| "redirect_uri_mismatch" | Ensure callback URL matches exactly in Google Console |
| Cookies not being set | Check `sameSite` and `secure` cookie settings |
| Session not persisting | Verify DATABASE_URL is correct and session table exists |

---

## Post-Deployment Checklist

### Immediate Verification

- [ ] **Health Check**: `curl https://api.yourapp.com/api/health`
  - Expected: `{"status":"ok","database":"connected"}`

- [ ] **Frontend Loads**: Navigate to `https://app.yourapp.com`
  - Expected: Login page renders without errors

- [ ] **HTTPS Active**: Check for padlock icon in browser
  - Verify both frontend and backend use HTTPS

- [ ] **OAuth Flow**: Click "Continue with Google"
  - Expected: Redirect to Google, then back to dashboard

- [ ] **Session Persistence**: Refresh page after login
  - Expected: User remains logged in

- [ ] **CSRF Token**: Check DevTools Network for CSRF requests
  - Expected: Token fetched on app init

### Functional Testing

- [ ] **Create Workout**: Start a new workout session
- [ ] **Add Exercise**: Select an exercise from library
- [ ] **Add Set**: Log weight and reps
- [ ] **Finish Workout**: Complete the workout
- [ ] **View History**: Check workout appears in history
- [ ] **Mobile Test**: Test on actual mobile device

### Performance Testing

- [ ] **Lighthouse Audit**: Run on mobile
  - Target: >90% mobile usability, >80% performance

- [ ] **API Response Times**: Monitor for < 500ms responses
  - Use Railway metrics dashboard

### Security Verification

- [ ] **CORS Headers**: Verify only allowed origin works
  - Test from different origin should fail

- [ ] **Cookie Flags**: Inspect cookies in DevTools
  - `httpOnly`, `secure`, `sameSite` should be set

- [ ] **User Isolation**: Verify user can only see own data
  - Critical security check

---

## Monitoring and Maintenance

### Railway Monitoring

Railway provides built-in metrics:

1. **Dashboard Metrics**:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request counts

2. **Logs**:
   - Real-time log streaming
   - Historical log search

3. **Alerts** (Pro plan):
   - Configure alerts for high resource usage
   - Notification via email/Slack

### Recommended Monitoring Setup

#### Phase 1: Basic (MVP)

- Railway built-in metrics
- Browser DevTools for frontend errors
- Manual health checks

#### Phase 2: Enhanced

Add Sentry for error tracking:

**Backend** (`packages/backend/src/index.ts`):
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

**Frontend** (`packages/frontend/src/main.tsx`):
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### Database Maintenance

1. **Automatic Backups**: Enabled by default on Railway Pro
2. **Manual Backups**: Use `pg_dump` before major changes
3. **Connection Pooling**: Prisma handles this automatically
4. **Index Maintenance**: PostgreSQL auto-vacuums

### Update Strategy

1. **Dependency Updates**: Monthly review of `npm outdated`
2. **Security Patches**: Apply immediately when announced
3. **Node.js Updates**: Test in development before production
4. **Database Updates**: Follow Railway's managed upgrade path

---

## Cost Estimates

### MVP Stage (0-1000 users)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Railway Backend | $5-10 | Usage-based |
| Railway PostgreSQL | $3-5 | ~500MB-1GB data |
| Vercel Frontend | $0 | Free tier |
| Custom Domain | $1-2 | If using Cloudflare |
| **Total** | **$8-17/month** | |

### Growth Stage (1000-10000 users)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Railway Backend | $15-40 | Increased usage |
| Railway PostgreSQL | $10-20 | Larger dataset |
| Vercel Frontend | $0-20 | May need Pro |
| Sentry | $0-26 | Error tracking |
| **Total** | **$25-106/month** | |

### Cost Optimization Tips

1. **Right-size resources**: Monitor and adjust based on actual usage
2. **Caching**: Implement Redis for session caching (reduces DB load)
3. **CDN**: Vercel's CDN reduces backend traffic
4. **Code efficiency**: Optimize database queries, use pagination

---

## Scaling Strategy

### Vertical Scaling (Quick Wins)

Railway allows easy resource increases:

1. Go to Service Settings
2. Increase memory/CPU limits
3. Deploy (no downtime)

### Horizontal Scaling (Future)

When single instance isn't enough:

1. **Session Handling**: Already uses PostgreSQL (supports multiple instances)
2. **Load Balancing**: Railway handles this automatically
3. **Database**: Consider read replicas for heavy read loads

### Scaling Indicators

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 80% sustained | 5+ minutes | Increase limits |
| Memory > 85% | Consistent | Increase limits |
| Response time > 1s | p95 | Investigate/scale |
| Database connections > 80 | Pool size | Add connection pooling |

### Future Architecture (High Scale)

```
                         [CloudFlare CDN]
                               |
               +---------------+---------------+
               |                               |
        [Vercel Edge]                   [Railway Load Balancer]
               |                               |
        [Static Assets]          +-------------+-------------+
                                 |             |             |
                           [Backend 1]   [Backend 2]   [Backend N]
                                 |             |             |
                                 +------+------+
                                        |
                              [PostgreSQL Primary]
                                        |
                              [Read Replicas (optional)]
```

---

## Rollback Procedures

### Frontend Rollback (Vercel)

1. Go to Vercel Dashboard -> Deployments
2. Find the previous working deployment
3. Click "..." -> "Promote to Production"
4. Instant rollback (no rebuild needed)

### Backend Rollback (Railway)

Option A: Redeploy Previous Commit
1. Go to Railway Dashboard -> Deployments
2. Find previous successful deployment
3. Click "Redeploy"

Option B: Git Revert
```bash
git revert HEAD
git push origin main
# Railway auto-deploys
```

### Database Rollback

**Before any migration, always backup:**
```bash
railway run pg_dump -Fc > backup_$(date +%Y%m%d).dump
```

**Restore if needed:**
```bash
railway run pg_restore -c -d $DATABASE_URL backup_file.dump
```

---

## Appendix

### A. Railway CLI Commands

```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run command in production
railway run <command>

# Open shell
railway shell

# View environment
railway variables
```

### B. Vercel CLI Commands

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod

# View environment
vercel env ls
```

### C. Prisma Commands (Production)

```bash
# Run migrations (production)
railway run npx prisma migrate deploy

# Generate client
railway run npx prisma generate

# Seed database
railway run npx prisma db seed

# Open studio (local connection to prod DB)
# NOT RECOMMENDED - use with caution
DATABASE_URL="production_url" npx prisma studio
```

### D. Health Check Endpoints

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `GET /api/health` | Basic health | `{"status":"ok","database":"connected"}` |
| `GET /api/auth/csrf-token` | CSRF token | `{"csrfToken":"..."}` |
| `GET /api/auth/me` | Auth check | `{"message":"Not authenticated"}` or user object |

### E. Useful Resources

- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deploy Guide](https://www.prisma.io/docs/guides/deployment)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2/web-server)

### F. Support Contacts

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Google Cloud: https://cloud.google.com/support

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-01 | Technical Architect | Initial document |

---

**End of Document**
