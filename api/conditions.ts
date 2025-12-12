import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateRequest, ConditionsRequestSchema } from '../lib/utils/validators.js';
import { getCacheManager, CacheManager, CACHE_TTL } from '../lib/cache/cache-manager.js';
import { scrapeResortConditions } from '../lib/scrapers/resort-scraper.js';
import type { SkiConditions } from '../lib/utils/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for Lovable integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request
    const validatedData = validateRequest(ConditionsRequestSchema, req.body);
    const { resortName, resortUrl, location } = validatedData;

    // Get cache manager
    const cache = getCacheManager();
    const cacheKey = CacheManager.resortKey(resortName);

    // Try to get from cache
    const conditions = await cache.getOrFetch<SkiConditions>(
      cacheKey,
      CACHE_TTL.RESORT_CONDITIONS,
      async () => {
        // Cache miss - scrape fresh data
        return await scrapeResortConditions({
          name: resortName,
          url: resortUrl,
          location,
        });
      }
    );

    return res.status(200).json({
      success: true,
      data: conditions,
      cached: await cache.get(cacheKey) !== null,
    });
  } catch (error) {
    console.error('Conditions API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
