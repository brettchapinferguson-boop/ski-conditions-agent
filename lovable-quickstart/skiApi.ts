// Ski Conditions API Client for Lovable
// Replace API_BASE_URL with your Vercel deployment URL

const API_BASE_URL = 'https://YOUR-APP.vercel.app/api';

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
