# Lovable Quick Start Files

Copy these files directly into your Lovable project to get started instantly.

## Quick Setup (3 steps)

### 1. Deploy Your Agent

First, deploy the ski conditions agent to get your API URL:

```bash
cd ~/ski-conditions-agent
vercel --prod
```

Copy your deployment URL (e.g., `https://ski-agent-xyz.vercel.app`)

### 2. Copy Files to Lovable

Copy these 3 files into your Lovable project:

- **`skiApi.ts`** → Add to your project (e.g., in `src/utils/` or `src/lib/`)
- **`ResortSearch.tsx`** → Example component for searching resorts
- **`FindBest.tsx`** → Example component for finding best skiing

### 3. Update API URL

In `skiApi.ts`, replace the API URL with your deployment URL:

```typescript
const API_BASE_URL = 'https://YOUR-ACTUAL-URL.vercel.app/api';
```

## Using the Components

### Basic Usage (Resort Search)

```tsx
import ResortSearch from './ResortSearch';

function App() {
  return <ResortSearch />;
}
```

### Basic Usage (Find Best)

```tsx
import FindBest from './FindBest';

function App() {
  return <FindBest />;
}
```

### Combined App

```tsx
import { useState } from 'react';
import ResortSearch from './ResortSearch';
import FindBest from './FindBest';

function App() {
  const [tab, setTab] = useState('search');

  return (
    <div>
      <nav className="flex gap-4 p-4 border-b">
        <button
          onClick={() => setTab('search')}
          className={tab === 'search' ? 'font-bold' : ''}
        >
          Search Resort
        </button>
        <button
          onClick={() => setTab('best')}
          className={tab === 'best' ? 'font-bold' : ''}
        >
          Find Best Snow
        </button>
      </nav>

      {tab === 'search' && <ResortSearch />}
      {tab === 'best' && <FindBest />}
    </div>
  );
}
```

## API Functions Reference

All available functions are in `skiApi.ts`:

### Get Resort Conditions
```typescript
const conditions = await getResortConditions('Vail');
```

### Get Forecast
```typescript
const forecast = await getForecast({ name: 'Vail, CO' }, 7);
```

### Find Best Skiing
```typescript
const recommendations = await findBestSkiing({ region: 'Colorado' });
```

## Customization

Feel free to customize the components:
- Change colors (update Tailwind classes)
- Add more stats to display
- Add your own branding
- Combine multiple features

## Need Help?

- See `LOVABLE_INTEGRATION.md` for detailed guide
- Check Vercel logs if API calls fail
- Test API with curl to verify it's working
