// Core type definitions for ski conditions agent

export interface Resort {
  name: string;
  url?: string;
  location?: {
    lat: number;
    lon: number;
  };
}

export interface SkiConditions {
  resort: string;
  lastUpdated: string;
  snowDepth?: number; // inches
  newSnow24h?: number; // inches
  newSnow48h?: number; // inches
  newSnow7d?: number; // inches
  weather: {
    current: string;
    temp: number; // Fahrenheit
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

export interface ForecastDay {
  date: string;
  snowfall: number; // inches
  tempHigh: number;
  tempLow: number;
  wind?: string;
  conditions: string;
}

export interface Forecast {
  location: string;
  lastUpdated: string;
  days: ForecastDay[];
}

export interface BestSkiingRecommendation {
  resort: string;
  location: string;
  score: number; // 0-100
  reasoning: string;
  currentConditions: Partial<SkiConditions>;
}

export interface ConditionsRequest {
  resortName: string;
  resortUrl?: string;
  location?: {
    lat: number;
    lon: number;
  };
}

export interface ForecastRequest {
  location: {
    lat: number;
    lon: number;
  } | {
    name: string;
  };
  days?: number;
}

export interface FindBestRequest {
  region?: string; // "World", "North America", "Colorado", etc.
  radius?: {
    center: {
      lat: number;
      lon: number;
    };
    miles: number;
  };
  criteria?: {
    powder?: boolean;
    groomed?: boolean;
    park?: boolean;
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export type ClaudeModel = 'claude-3-5-haiku-20241022' | 'claude-3-5-sonnet-20241022';

export interface AIUsageMetrics {
  model: ClaudeModel;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}
