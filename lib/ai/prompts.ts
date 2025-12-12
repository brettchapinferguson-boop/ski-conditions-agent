import type { Resort } from '../utils/types.js';

export function getResortConditionsPrompt(resort: Resort): string {
  const basePrompt = `You are a ski conditions expert. Find the current ski conditions for ${resort.name}.`;

  if (resort.url) {
    return `${basePrompt}

Visit the resort website at ${resort.url} and extract the following information:
- Snow depth (base and summit)
- New snow in last 24 hours, 48 hours, and 7 days
- Current weather conditions and temperature
- Number of lifts open vs total
- Number of trails/terrain open vs total
- Surface conditions (powder, packed powder, groomed, etc.)

If the website doesn't load or you can't access it, search for "${resort.name} ski conditions" and find the most recent, accurate information from reliable sources.

Return ONLY a JSON object with this structure:
{
  "resort": "resort name",
  "lastUpdated": "ISO timestamp",
  "snowDepth": number (inches, base depth),
  "newSnow24h": number (inches),
  "newSnow48h": number (inches),
  "newSnow7d": number (inches),
  "weather": {
    "current": "description",
    "temp": number (Fahrenheit),
    "wind": "description"
  },
  "lifts": {"open": number, "total": number},
  "terrain": {"open": number, "total": number},
  "surfaceConditions": "description"
}`;
  }

  return `${basePrompt}

Search for "${resort.name} ski conditions" and find the most recent, accurate real-time information. Check the resort's official website, snow report sites, and weather sources.

Extract the following information:
- Snow depth (base and summit)
- New snow in last 24 hours, 48 hours, and 7 days
- Current weather conditions and temperature
- Number of lifts open vs total
- Number of trails/terrain open vs total
- Surface conditions (powder, packed powder, groomed, etc.)

Return ONLY a JSON object with this structure:
{
  "resort": "resort name",
  "lastUpdated": "ISO timestamp",
  "snowDepth": number (inches, base depth),
  "newSnow24h": number (inches),
  "newSnow48h": number (inches),
  "newSnow7d": number (inches),
  "weather": {
    "current": "description",
    "temp": number (Fahrenheit),
    "wind": "description"
  },
  "lifts": {"open": number, "total": number},
  "terrain": {"open": number, "total": number},
  "surfaceConditions": "description"
}`;
}

export function getForecastPrompt(location: string | { lat: number; lon: number }, days: number = 7): string {
  const locationStr = typeof location === 'string'
    ? location
    : `coordinates ${location.lat}, ${location.lon}`;

  return `Get the ${days}-day snow forecast for ${locationStr}.

Search for accurate weather and snow forecasts from reliable sources like:
- NOAA/Weather.gov (for US locations)
- OpenSnow
- Weather forecasting sites
- Resort forecasts if this is near ski resorts

For each day, extract:
- Date
- Expected snowfall (inches)
- High and low temperatures (Fahrenheit)
- Wind conditions
- Overall conditions description

Return ONLY a JSON object with this structure:
{
  "location": "location name",
  "lastUpdated": "ISO timestamp",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "snowfall": number (inches),
      "tempHigh": number (Fahrenheit),
      "tempLow": number (Fahrenheit),
      "wind": "description",
      "conditions": "description"
    }
  ]
}`;
}

export function getFindBestPrompt(
  region?: string,
  radius?: { center: { lat: number; lon: number }; miles: number },
  criteria?: { powder?: boolean; groomed?: boolean; park?: boolean }
): string {
  let locationStr = 'anywhere in the world';

  if (radius) {
    locationStr = `within ${radius.miles} miles of coordinates ${radius.center.lat}, ${radius.center.lon}`;
  } else if (region) {
    locationStr = `in ${region}`;
  }

  let criteriaStr = '';
  if (criteria) {
    const prefs = [];
    if (criteria.powder) prefs.push('powder skiing');
    if (criteria.groomed) prefs.push('groomed runs');
    if (criteria.park) prefs.push('terrain parks');
    if (prefs.length > 0) {
      criteriaStr = `\nUser preferences: ${prefs.join(', ')}`;
    }
  }

  return `Find the best skiing right now ${locationStr}.${criteriaStr}

Search for current ski conditions, recent snowfall, and forecasts to determine which ski resorts currently have the best conditions. Consider:
- Recent snowfall (last 24-48 hours)
- Current snow depth
- Weather conditions
- Forecast for next few days
- Overall snow quality

Return the top 3-5 recommendations ranked by how good the skiing is right now.

Return ONLY a JSON object with this structure:
{
  "recommendations": [
    {
      "resort": "resort name",
      "location": "location description",
      "score": number (0-100),
      "reasoning": "why this resort is recommended",
      "currentConditions": {
        "newSnow24h": number (inches),
        "snowDepth": number (inches),
        "weather": {"current": "description", "temp": number}
      }
    }
  ]
}`;
}

export const SYSTEM_PROMPT = `You are a ski conditions and weather expert assistant. Your job is to find accurate, real-time ski conditions and weather forecasts.

When searching for information:
1. Prioritize official resort websites and snow report sites
2. Look for the most recent data (posted today or within last few hours)
3. Return accurate data - if you can't find something, indicate it as null/undefined
4. Always return valid JSON only, with no additional text or explanations
5. Use Fahrenheit for temperatures and inches for snow measurements`;
