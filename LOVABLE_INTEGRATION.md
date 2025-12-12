# Lovable Integration Guide

Complete guide for integrating the Ski Conditions Agent with your Lovable app.

## Step 1: Deploy Your Agent First

Before integrating, you need to deploy your agent to get a live URL.

### Quick Deploy (5 minutes)

1. **Get Anthropic API Key**
   - Go to https://console.anthropic.com/
   - Sign up and create an API key
   - Copy it (starts with `sk-ant-`)

2. **Deploy to Vercel**
   ```bash
   cd ~/ski-conditions-agent

   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Deploy
   vercel --prod
   ```

   Follow prompts, copy the deployment URL (e.g., `https://ski-conditions-agent.vercel.app`)

3. **Add Environment Variables**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your API key
   - Go to Storage tab → Create KV database
   - Redeploy: Deployments → Redeploy

## Step 2: Add API Client to Lovable

Create an API utility file in your Lovable project.

### File: `utils/skiApi.ts` (or `skiApi.js`)

```typescript
// Replace with your actual Vercel deployment URL
const API_BASE_URL = 'https://your-app.vercel.app/api';

export interface SkiConditions {
  resort: string;
  lastUpdated: string;
  snowDepth?: number;
  newSnow24h?: number;
  newSnow48h?: number;
  newSnow7d?: number;
  weather: {
    current: string;
    temp: number;
    wind?: string;
  };
  lifts?: {
    open: number;
    total: number;
  };
  terrain?: {
    open: number;
    total: number;
  };
  surfaceConditions?: string;
}

export interface Forecast {
  location: string;
  lastUpdated: string;
  days: Array<{
    date: string;
    snowfall: number;
    tempHigh: number;
    tempLow: number;
    wind?: string;
    conditions: string;
  }>;
}

export interface BestSkiingRecommendation {
  resort: string;
  location: string;
  score: number;
  reasoning: string;
  currentConditions: Partial<SkiConditions>;
}

// Get current conditions for a resort
export async function getResortConditions(
  resortName: string,
  resortUrl?: string
): Promise<SkiConditions> {
  const response = await fetch(`${API_BASE_URL}/conditions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resortName,
      resortUrl,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conditions');
  }

  const result = await response.json();
  return result.data;
}

// Get weather forecast
export async function getForecast(
  location: { lat: number; lon: number } | { name: string },
  days: number = 7
): Promise<Forecast> {
  const response = await fetch(`${API_BASE_URL}/forecast`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location,
      days,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch forecast');
  }

  const result = await response.json();
  return result.data;
}

// Find best skiing in a region
export async function findBestSkiing(params: {
  region?: string;
  radius?: {
    center: { lat: number; lon: number };
    miles: number;
  };
  criteria?: {
    powder?: boolean;
    groomed?: boolean;
    park?: boolean;
  };
}): Promise<BestSkiingRecommendation[]> {
  const response = await fetch(`${API_BASE_URL}/find-best`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to find best skiing');
  }

  const result = await response.json();
  return result.data.recommendations;
}
```

## Step 3: Use in Your Lovable Components

### Example 1: Resort Conditions Component

```tsx
import { useState } from 'react';
import { getResortConditions, type SkiConditions } from '@/utils/skiApi';

export default function ResortConditions() {
  const [resortName, setResortName] = useState('');
  const [conditions, setConditions] = useState<SkiConditions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!resortName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await getResortConditions(resortName);
      setConditions(data);
    } catch (err) {
      setError('Failed to fetch conditions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={resortName}
          onChange={(e) => setResortName(e.target.value)}
          placeholder="Enter resort name (e.g., Vail)"
          className="flex-1 px-4 py-2 border rounded-lg"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Conditions'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {conditions && (
        <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
          <h2 className="text-2xl font-bold">{conditions.resort}</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {conditions.snowDepth && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.snowDepth}"
                </div>
                <div className="text-sm text-gray-600">Base Depth</div>
              </div>
            )}

            {conditions.newSnow24h !== undefined && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.newSnow24h}"
                </div>
                <div className="text-sm text-gray-600">24h Snow</div>
              </div>
            )}

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {conditions.weather.temp}°F
              </div>
              <div className="text-sm text-gray-600">{conditions.weather.current}</div>
            </div>

            {conditions.lifts && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {conditions.lifts.open}/{conditions.lifts.total}
                </div>
                <div className="text-sm text-gray-600">Lifts Open</div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Updated: {new Date(conditions.lastUpdated).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Example 2: Find Best Skiing Component

```tsx
import { useState } from 'react';
import { findBestSkiing, type BestSkiingRecommendation } from '@/utils/skiApi';

export default function FindBestSkiing() {
  const [region, setRegion] = useState('Colorado');
  const [recommendations, setRecommendations] = useState<BestSkiingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await findBestSkiing({ region });
      setRecommendations(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        >
          <option value="Colorado">Colorado</option>
          <option value="Utah">Utah</option>
          <option value="California">California</option>
          <option value="North America">North America</option>
          <option value="World">Anywhere in the World</option>
        </select>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          {loading ? 'Searching...' : 'Find Best Snow'}
        </button>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className="p-6 bg-white rounded-lg shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-bold">{rec.resort}</h3>
                <p className="text-gray-600">{rec.location}</p>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {rec.score}/100
              </div>
            </div>

            <p className="text-gray-700 mb-4">{rec.reasoning}</p>

            {rec.currentConditions && (
              <div className="flex gap-4 text-sm">
                {rec.currentConditions.newSnow24h !== undefined && (
                  <div>
                    <span className="font-semibold">24h Snow:</span> {rec.currentConditions.newSnow24h}"
                  </div>
                )}
                {rec.currentConditions.snowDepth && (
                  <div>
                    <span className="font-semibold">Base:</span> {rec.currentConditions.snowDepth}"
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 3: Weather Forecast Component

```tsx
import { useState, useEffect } from 'react';
import { getForecast, type Forecast } from '@/utils/skiApi';

export default function WeatherForecast({ resortName }: { resortName: string }) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, [resortName]);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const data = await getForecast({ name: resortName }, 7);
      setForecast(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading forecast...</div>;
  }

  if (!forecast) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">7-Day Forecast</h3>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {forecast.days.map((day, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow text-center">
            <div className="font-semibold text-sm mb-2">
              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {day.snowfall}"
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {day.tempHigh}° / {day.tempLow}°
            </div>
            <div className="text-xs text-gray-500">
              {day.conditions}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Step 4: Complete App Example

Here's how to structure your Lovable app with all features:

```tsx
import { useState } from 'react';
import ResortConditions from '@/components/ResortConditions';
import FindBestSkiing from '@/components/FindBestSkiing';
import WeatherForecast from '@/components/WeatherForecast';

export default function SkiApp() {
  const [activeTab, setActiveTab] = useState<'search' | 'best' | 'forecast'>('search');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-center">
          ⛷️ Ski Conditions Tracker
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'search'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
          >
            Search Resort
          </button>
          <button
            onClick={() => setActiveTab('best')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'best'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600'
            }`}
          >
            Find Best Snow
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'forecast'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600'
            }`}
          >
            Forecast
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'search' && <ResortConditions />}
        {activeTab === 'best' && <FindBestSkiing />}
        {activeTab === 'forecast' && <WeatherForecast resortName="Vail" />}
      </div>
    </div>
  );
}
```

## Step 5: Update API URL

Don't forget to update the `API_BASE_URL` in `utils/skiApi.ts` with your actual Vercel deployment URL:

```typescript
const API_BASE_URL = 'https://YOUR-APP.vercel.app/api';
```

## Testing in Lovable

1. **Copy the API utility file** (`skiApi.ts`) into your Lovable project
2. **Copy the component examples** you want to use
3. **Update the API URL** with your deployed Vercel URL
4. **Test each feature**:
   - Search for a resort (try "Vail", "Aspen", "Whistler")
   - Find best skiing in a region
   - View forecasts

## Performance Tips

1. **Show loading states** - AI queries take 3-8 seconds
2. **Cache in state** - Don't refetch on every render
3. **Debounce searches** - Wait until user stops typing
4. **Show errors gracefully** - Network issues happen

## Cost Monitoring

Each user action triggers an API call. With 85% caching:
- Most searches: Free (cached) or $0.0003-0.001
- Find best: $0.003-0.015 (uses smarter AI)
- Budget alert triggers at $100 total (logged in Vercel)

Your agent automatically handles caching - popular resorts like Vail will be cached most of the time!

## Need Help?

- Check Vercel function logs for errors
- Test API directly: `curl -X POST https://your-app.vercel.app/api/conditions -H "Content-Type: application/json" -d '{"resortName":"Vail"}'`
- Verify CORS is working (already configured in the API)
