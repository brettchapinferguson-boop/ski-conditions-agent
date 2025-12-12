# Deployment Guide

## Prerequisites

1. **Anthropic API Key**
   - Sign up at https://console.anthropic.com/
   - Create an API key
   - Cost: Pay-as-you-go (~$0.0003-0.015 per query)

2. **Vercel Account**
   - Sign up at https://vercel.com
   - Free tier includes:
     - 100GB bandwidth/month
     - 100GB-hrs serverless function execution
     - 1 Vercel KV database

3. **GitHub Account** (recommended for auto-deploy)
   - Create repo and push this code

## Step 1: Push to GitHub

```bash
# Create new repo on GitHub (https://github.com/new)
# Then push your code:

cd ~/ski-conditions-agent
git remote add origin https://github.com/YOUR_USERNAME/ski-conditions-agent.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects settings (no configuration needed)
4. Click "Deploy"

### Option B: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Step 3: Add Vercel KV Database

1. Go to your project in Vercel Dashboard
2. Click "Storage" tab
3. Click "Create Database" → "KV"
4. Name it "ski-conditions-cache"
5. Click "Create"

Vercel automatically adds these environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## Step 4: Add Anthropic API Key

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Environment Variables"
3. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your API key (starts with `sk-ant-`)
   - **Environments:** Production, Preview, Development

4. Click "Save"

## Step 5: Redeploy

After adding environment variables, redeploy:

```bash
# Via dashboard: Click "Deployments" → "Redeploy"
# Via CLI:
vercel --prod
```

## Step 6: Test Your Endpoints

Your API is now live at `https://your-project.vercel.app`

```bash
# Test conditions endpoint
curl -X POST https://your-project.vercel.app/api/conditions \
  -H "Content-Type: application/json" \
  -d '{"resortName": "Vail"}'

# Test forecast endpoint
curl -X POST https://your-project.vercel.app/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"location": {"name": "Vail, CO"}, "days": 7}'

# Test find-best endpoint
curl -X POST https://your-project.vercel.app/api/find-best \
  -H "Content-Type: application/json" \
  -d '{"region": "Colorado"}'
```

## Step 7: Integrate with Lovable

In your Lovable app, use the deployed URL:

```javascript
const API_BASE = 'https://your-project.vercel.app/api';

async function getSkiConditions(resortName) {
  const response = await fetch(`${API_BASE}/conditions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resortName }),
  });
  return response.json();
}

async function findBestSkiing(region) {
  const response = await fetch(`${API_BASE}/find-best`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ region }),
  });
  return response.json();
}
```

## Monitoring Costs

### Vercel Costs (Free Tier Limits)
- **Bandwidth:** 100GB/month (plenty for API)
- **Function execution:** 100GB-hrs/month
- **KV storage:** 256MB + 100K reads/day (sufficient for MVP)

If you exceed free tier:
- Bandwidth: $0.15/GB
- Function execution: $0.50/GB-hr
- KV: $0.30/100K reads beyond free tier

### Anthropic API Costs

With 85% cache hit rate and 1000 queries/day:
- 850 cached queries: $0
- 140 Haiku queries: ~$0.14 ($0.001 avg/query)
- 10 Sonnet queries: ~$0.10 ($0.01 avg/query)
- **Total:** ~$0.24/day = **$7.20/month**

Budget alerts trigger at $100 total spend (logs in Vercel function output).

### Monitoring Dashboard

View function logs in Vercel Dashboard:
1. Go to your project
2. Click "Deployments" → Select latest deployment
3. Click "Functions" → View logs for each endpoint

Look for cost tracking logs:
```
[Claude claude-3-5-haiku-20241022] Tokens: 450 in / 280 out | Cost: $0.0005 | Total: $2.34
⚠️  BUDGET ALERT: Total AI cost has reached $100.00
```

## Troubleshooting

### "Failed to query Claude" Error
- Check `ANTHROPIC_API_KEY` is set correctly in Vercel
- Verify API key is valid in Anthropic Console
- Check Anthropic account has credits/payment method

### "Cache not working" / Slow Responses
- Verify Vercel KV is connected
- Check KV environment variables are set
- View KV data in Vercel Dashboard → Storage

### CORS Errors from Lovable
- API already has CORS headers (`Access-Control-Allow-Origin: *`)
- If issues persist, check Lovable's fetch implementation

## Scaling Recommendations

As your app grows:

1. **Implement rate limiting** (prevent abuse)
   - Add rate limit middleware to API endpoints
   - Use Vercel Edge Config for rate limit tracking

2. **Add cache warming** (improve hit rate)
   - Create cron job endpoint `/api/warm-cache`
   - Use Vercel Cron to run daily at 3am
   - Pre-fetch top 100 popular resorts

3. **Monitor costs closely**
   - Set up Anthropic API usage alerts
   - Track metrics: cache hit rate, avg query cost, daily spend
   - Consider switching expensive queries to cheaper models

4. **Upgrade Vercel plan** (if needed)
   - Pro plan ($20/mo): 1TB bandwidth, unlimited KV
   - Only needed if you exceed free tier limits

## Optional: Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain (e.g., `api.yourskiapp.com`)
3. Update DNS records as shown
4. Use custom domain in Lovable integration

## Security

The API is public by design (for Lovable integration), but consider:

1. **Add API key authentication** for production
2. **Rate limiting** per user/IP
3. **Request validation** (already implemented via Zod)
4. **Monitor for abuse** in Vercel logs

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Anthropic Docs:** https://docs.anthropic.com
- **This repo:** Check CLAUDE.md for development guidance
