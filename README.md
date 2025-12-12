# Ski Conditions Agent

AI-powered serverless agent for real-time ski conditions, weather forecasts, and finding the best skiing locations. Built for integration with Lovable apps.

## Features

- **Resort Conditions**: Get real-time conditions for any ski resort worldwide
- **Weather Forecasts**: 7-day snow and weather forecasts
- **Find Best Skiing**: AI-powered recommendations for the best skiing right now
- **Cost-Optimized**: Aggressive caching and smart AI model selection (Haiku vs Sonnet)
- **Fast**: <2s for cached queries, <8s for AI queries
- **Scalable**: Serverless architecture on Vercel

## Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- [Vercel account](https://vercel.com)
- [Anthropic API key](https://console.anthropic.com/)

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Add your API keys to .env
```

### 3. Set Up Vercel KV

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new KV store or add to existing project
3. Copy the KV credentials to your `.env` file

### 4. Local Development

```bash
# Run development server
npm run dev

# Test locally at http://localhost:3000
```

### 5. Deploy to Vercel

```bash
# Login to Vercel
npx vercel login

# Deploy
npm run deploy
```

## API Endpoints

### POST /api/conditions

Get current ski conditions for a resort.

**Request:**
```json
{
  "resortName": "Vail",
  "resortUrl": "https://www.vail.com/the-mountain/mountain-conditions/snow-and-weather-report.aspx",
  "location": {
    "lat": 39.6403,
    "lon": -106.3742
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resort": "Vail",
    "lastUpdated": "2024-12-11T17:00:00Z",
    "snowDepth": 48,
    "newSnow24h": 6,
    "weather": {
      "current": "Snowing",
      "temp": 28,
      "wind": "10-15 mph"
    },
    "lifts": {
      "open": 28,
      "total": 31
    }
  }
}
```

### POST /api/forecast

Get weather and snow forecast.

**Request:**
```json
{
  "location": {
    "lat": 39.6403,
    "lon": -106.3742
  },
  "days": 7
}
```

### POST /api/find-best

Find the best skiing right now in a region.

**Request:**
```json
{
  "region": "Colorado",
  "criteria": {
    "powder": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "resort": "Steamboat",
        "location": "Steamboat Springs, CO",
        "score": 95,
        "reasoning": "15 inches of fresh powder in last 24h...",
        "currentConditions": {
          "newSnow24h": 15,
          "snowDepth": 72
        }
      }
    ]
  }
}
```

## Integration with Lovable

From your Lovable app, make fetch requests to your deployed Vercel endpoints:

```javascript
// Example: Get conditions
const response = await fetch('https://your-app.vercel.app/api/conditions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resortName: 'Vail',
  }),
});

const data = await response.json();
console.log(data.data); // Ski conditions
```

## Cost Management

The agent is optimized for low costs:

- **Caching**: 85%+ cache hit rate for popular queries
- **Smart AI**: Haiku (cheap) for most queries, Sonnet (expensive) only for complex reasoning
- **Target cost**: <$5/day for 1000 queries
- **Budget alerts**: Automatically alerts when spending reaches $100

Monitor costs in your console logs:
```
[Claude claude-3-5-haiku-20241022] Tokens: 450 in / 280 out | Cost: $0.0005 | Total: $2.34
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `KV_REST_API_URL` | Yes | Vercel KV URL (auto-provided) |
| `KV_REST_API_TOKEN` | Yes | Vercel KV token (auto-provided) |
| `OPENWEATHER_API_KEY` | No | OpenWeather API key (optional) |

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Build
npm run build

# Deploy to production
npm run deploy
```

## Architecture

- **Vercel Serverless Functions**: Fast, auto-scaling API endpoints
- **Claude AI**: Intelligent web scraping and data extraction
- **Vercel KV (Redis)**: Distributed caching for cost optimization
- **TypeScript**: Type-safe development

## License

MIT
