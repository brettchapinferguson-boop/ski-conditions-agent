import { getClaudeClient } from '../ai/claude-client.js';
import { getResortConditionsPrompt, SYSTEM_PROMPT } from '../ai/prompts.js';
import type { Resort, SkiConditions } from '../utils/types.js';

export async function scrapeResortConditions(resort: Resort): Promise<SkiConditions> {
  const client = getClaudeClient();
  const prompt = getResortConditionsPrompt(resort);

  try {
    // Use Haiku for cost efficiency (simple data extraction)
    const { data } = await client.queryWithStructuredOutput<SkiConditions>(prompt, {
      model: 'claude-3-5-haiku-20241022',
      maxTokens: 2048,
      systemPrompt: SYSTEM_PROMPT,
    });

    return data;
  } catch (error) {
    console.error(`Failed to scrape conditions for ${resort.name}:`, error);
    throw new Error(`Unable to fetch conditions for ${resort.name}`);
  }
}
