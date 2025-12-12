import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateRequest, FindBestRequestSchema } from '../lib/utils/validators.js';
import { getCacheManager, CacheManager, CACHE_TTL } from '../lib/cache/cache-manager.js';
import { getClaudeClient } from '../lib/ai/claude-client.js';
import { getFindBestPrompt, SYSTEM_PROMPT } from '../lib/ai/prompts.js';
import type { BestSkiingRecommendation } from '../lib/utils/types.js';

interface FindBestResponse {
  recommendations: BestSkiingRecommendation[];
}

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
    const validatedData = validateRequest(FindBestRequestSchema, req.body);
    const { region, radius, criteria } = validatedData;

    // Get cache manager
    const cache = getCacheManager();
    const cacheKey = CacheManager.findBestKey(region, radius);

    // Try to get from cache
    const result = await cache.getOrFetch<FindBestResponse>(
      cacheKey,
      CACHE_TTL.FIND_BEST,
      async () => {
        // Cache miss - use AI to find best skiing
        // Use Sonnet for complex reasoning (worth the extra cost)
        const client = getClaudeClient();
        const prompt = getFindBestPrompt(region, radius, criteria);

        const { data } = await client.queryWithStructuredOutput<FindBestResponse>(prompt, {
          model: 'claude-3-5-sonnet-20241022', // Use Sonnet for better reasoning
          maxTokens: 4096,
          systemPrompt: SYSTEM_PROMPT,
        });

        return data;
      }
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Find Best API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
