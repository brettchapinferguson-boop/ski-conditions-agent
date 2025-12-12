import axios from 'axios';
import type { Forecast, ForecastDay } from '../utils/types.js';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export async function getWeatherForecast(
  location: { lat: number; lon: number } | { name: string },
  days: number = 7
): Promise<Forecast> {
  // Use weather.gov (NOAA) for US locations - free and accurate
  if ('lat' in location) {
    return await getNoaaForecast(location.lat, location.lon, days);
  }

  // For named locations, use OpenWeather if API key is available
  if (OPENWEATHER_API_KEY) {
    return await getOpenWeatherForecast(location.name, days);
  }

  throw new Error('Weather API not configured');
}

async function getNoaaForecast(lat: number, lon: number, days: number): Promise<Forecast> {
  try {
    // Get grid point for location
    const pointResponse = await axios.get(
      `https://api.weather.gov/points/${lat},${lon}`,
      {
        headers: {
          'User-Agent': 'SkiConditionsAgent/1.0',
        },
      }
    );

    const forecastUrl = pointResponse.data.properties.forecast;

    // Get forecast
    const forecastResponse = await axios.get(forecastUrl, {
      headers: {
        'User-Agent': 'SkiConditionsAgent/1.0',
      },
    });

    const periods = forecastResponse.data.properties.periods.slice(0, days * 2); // Day and night periods

    const forecastDays: ForecastDay[] = [];
    for (let i = 0; i < periods.length; i += 2) {
      const dayPeriod = periods[i];
      const nightPeriod = periods[i + 1];

      forecastDays.push({
        date: new Date(dayPeriod.startTime).toISOString().split('T')[0],
        snowfall: 0, // NOAA doesn't provide snowfall in this endpoint
        tempHigh: dayPeriod.temperature,
        tempLow: nightPeriod?.temperature || dayPeriod.temperature,
        wind: dayPeriod.windSpeed,
        conditions: dayPeriod.shortForecast,
      });
    }

    return {
      location: `${lat}, ${lon}`,
      lastUpdated: new Date().toISOString(),
      days: forecastDays.slice(0, days),
    };
  } catch (error) {
    console.error('NOAA API error:', error);
    throw new Error('Failed to fetch NOAA forecast');
  }
}

async function getOpenWeatherForecast(locationName: string, days: number): Promise<Forecast> {
  try {
    // This is a placeholder - implement if OpenWeather API key is available
    throw new Error('OpenWeather integration not yet implemented');
  } catch (error) {
    console.error('OpenWeather API error:', error);
    throw new Error('Failed to fetch OpenWeather forecast');
  }
}
