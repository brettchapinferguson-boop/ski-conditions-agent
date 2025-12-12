# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered serverless agent that provides real-time ski conditions, weather forecasts, and skiing recommendations. Built to integrate with Lovable apps via REST API.

**Key Technology Stack:**
- Vercel Serverless Functions (Node.js/TypeScript)
- Anthropic Claude AI (Haiku for data extraction, Sonnet for complex reasoning)
- Vercel KV (Redis) for distributed caching
- Zod for request validation

## Architecture

### Cost-First Design Philosophy

This system is optimized for minimal AI API costs:

1. **Aggressive caching** - 85%+ cache hit rate target with 45min-3hr TTLs
2. **Model selection** - Claude 3.5 Haiku for 95% of queries, Sonnet only for "find best" reasoning
3. **Budget tracking** - `ClaudeClient` tracks costs and alerts at $100 thresholds

### Request Flow

```
Lovable App → API Endpoint → Cache Check → AI Query (if cache miss) → Cache Store → Response
```

All endpoints follow this pattern:
1. Validate request with Zod schema
2. Generate cache key from request params
3. Check `CacheManager` for cached data
4. On miss: Call AI via `ClaudeClient` → Parse JSON response → Cache result
5. Return structured JSON response

### File Organization

- `api/` - Vercel serverless function endpoints (one file per endpoint)
- `lib/ai/` - Claude API client and prompt templates
- `lib/cache/` - Two-tier caching (memory + Vercel KV)
- `lib/scrapers/` - Resort scraping and weather API logic
- `lib/utils/` - TypeScript types and Zod validators

## Common Development Tasks

### Adding a New API Endpoint

1. Create `api/your-endpoint.ts` with Vercel handler signature
2. Add Zod validation schema to `lib/utils/validators.ts`
3. Add TypeScript types to `lib/utils/types.ts`
4. Add prompt template to `lib/ai/prompts.ts`
5. Add cache key generator to `CacheManager` class
6. Follow existing endpoint pattern (see `api/conditions.ts`)

### Modifying AI Prompts

All prompts live in `lib/ai/prompts.ts`. Key principles:
- Be specific about output format (always request JSON)
- Include field descriptions and units (Fahrenheit, inches)
- Use `SYSTEM_PROMPT` constant for consistent behavior
- Keep prompts concise to minimize token costs

### Adjusting Cache TTLs

Cache TTLs are defined in `lib/cache/cache-manager.ts` in the `CACHE_TTL` constant:
- Resort conditions: 45 minutes (balance freshness vs cost)
- Forecasts: 3 hours (slower changing data)
- Find best: 2 hours (expensive Sonnet queries)

When changing TTLs, consider the trade-off between data freshness and AI API costs.

### Model Selection

`lib/ai/claude-client.ts` supports two models:
- `claude-3-5-haiku-20241022` - Fast, cheap ($0.80/M input, $4/M output) - **default**
- `claude-3-5-sonnet-20241022` - Better reasoning ($3/M input, $15/M output) - use sparingly

Current usage:
- Haiku: Resort conditions, forecasts (simple extraction)
- Sonnet: Find best skiing (complex reasoning required)

### Cost Tracking

`ClaudeClient` automatically:
- Logs per-request costs and cumulative total
- Alerts when total reaches $100 increments
- Calculates costs based on token usage

Check logs for cost monitoring:
```
[Claude claude-3-5-haiku-20241022] Tokens: 450 in / 280 out | Cost: $0.0005 | Total: $2.34
```

## Testing Locally

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run Vercel dev server
npm run dev

# Test endpoint
curl -X POST http://localhost:3000/api/conditions \
  -H "Content-Type: application/json" \
  -d '{"resortName": "Vail"}'
```

**Note:** Local development uses Vercel KV, which requires Vercel project setup. Without KV, caching falls back to in-memory only (works but won't persist across function invocations).

## Deployment

```bash
# Deploy to Vercel
npm run deploy

# Or push to GitHub and let Vercel auto-deploy
git push origin main
```

Ensure these environment variables are set in Vercel dashboard:
- `ANTHROPIC_API_KEY`
- `KV_REST_API_URL` (auto-provided when KV is added)
- `KV_REST_API_TOKEN` (auto-provided when KV is added)

## Important Constraints

### Budget Management

- **Target:** <$5/day for 1000 queries (85% cached)
- **Alert threshold:** $100 total spend
- Monitor `ClaudeClient` logs for cost tracking
- Consider implementing rate limiting if costs spike

### Response Times

- Cached queries: <2 seconds
- AI queries (Haiku): <8 seconds
- AI queries (Sonnet): <15 seconds
- Vercel function timeout: 30 seconds (configured in `vercel.json`)

### Caching Strategy

The two-tier cache (`CacheManager`):
1. **Memory cache** - Ephemeral, per-instance, ultra-fast
2. **Vercel KV** - Distributed, persistent, sub-millisecond

Cache keys use slugified names/coordinates:
- `resort:vail:conditions`
- `forecast:39.64,-106.37`
- `best:colorado`

### Error Handling

All endpoints return consistent JSON:
```typescript
{ success: true, data: {...} }  // Success
{ success: false, error: "..." } // Error
```

Errors are logged but not exposed to user (security). Return user-friendly messages.

## Data Sources

### Primary: Claude AI

Claude intelligently scrapes and interprets:
- Resort websites (provided URL or searched)
- Weather services
- Snow report aggregators

### Secondary: Weather APIs

`lib/scrapers/weather-apis.ts` integrates:
- **Weather.gov (NOAA)** - Free, US-only, highly accurate
- **OpenWeather** - Global, requires API key (optional)

Weather APIs supplement AI data for forecasts.

## TypeScript Patterns

All request/response types defined in `lib/utils/types.ts`:
- Use strict TypeScript (enabled in `tsconfig.json`)
- Validate inputs with Zod schemas before processing
- Export interfaces for external consumption

Example:
```typescript
import type { SkiConditions } from '../lib/utils/types.js';
import { validateRequest, ConditionsRequestSchema } from '../lib/utils/validators.js';

const data = validateRequest(ConditionsRequestSchema, req.body);
```

## Debugging Tips

1. **Cache issues:** Check Vercel KV dashboard for stored keys
2. **AI response parsing:** Log `content` before JSON.parse to see raw Claude output
3. **Cost spikes:** Review `ClaudeClient` logs for unexpected Sonnet usage
4. **Slow responses:** Check if cache is working (look for HIT/MISS logs)

## Future Enhancements

Potential improvements (not yet implemented):
- Cache warming cron job for top 100 resorts
- WebSocket streaming for real-time updates
- Historical snow data trends
- User preference storage
- Multi-language support
- Alternative cheaper AI models (GPT-4o-mini)
