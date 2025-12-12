import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateRequest, ForecastRequestSchema } from '../lib/utils/validators.js';
import { getCacheManager, CacheManager, CACHE_TTL } from '../lib/cache/cache-manager.js';
import { getClaudeClient } from '../lib/ai/claude-client.js';
import { getForecastPrompt, SYSTEM_PROMPT } from '../lib/ai/prompts.js';
import type { Forecast } from '../lib/utils/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Optional API key check
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const validKey = process.env.API_KEY || 'ski-agent-2024-secure-key-x7h9p2m4';
  if (apiKey && apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  try {
    // Validate request
    const validatedData = validateRequest(ForecastRequestSchema, req.body);
    const { location, days = 7 } = validatedData;

    // Get cache manager
    const cache = getCacheManager();
    const cacheKey = CacheManager.forecastKey(location);

    // Try to get from cache
    const forecast = await cache.getOrFetch<Forecast>(
      cacheKey,
      CACHE_TTL.FORECAST,
      async () => {
        // Cache miss - fetch fresh forecast using AI
        const client = getClaudeClient();
        const prompt = getForecastPrompt(location, days);

        const { data } = await client.queryWithStructuredOutput<Forecast>(prompt, {
          model: 'claude-3-5-haiku-20241022', // Use Haiku for cost efficiency
          maxTokens: 2048,
          systemPrompt: SYSTEM_PROMPT,
        });

        return data;
      }
    );

    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error('Forecast API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
