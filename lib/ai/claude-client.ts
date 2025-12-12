import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeModel, AIUsageMetrics } from '../utils/types.js';

// Cost per million tokens (as of Dec 2024)
const MODEL_COSTS = {
  'claude-3-5-haiku-20241022': {
    input: 0.80,  // per 1M input tokens
    output: 4.00, // per 1M output tokens
  },
  'claude-3-5-sonnet-20241022': {
    input: 3.00,  // per 1M input tokens
    output: 15.00, // per 1M output tokens
  },
};

export class ClaudeClient {
  private client: Anthropic;
  private totalCost: number = 0;
  private budgetAlert: number = 100; // Alert at $100

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async query(
    prompt: string,
    options: {
      model?: ClaudeModel;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<{ content: string; metrics: AIUsageMetrics }> {
    const model = options.model || 'claude-3-5-haiku-20241022';
    const maxTokens = options.maxTokens || 2048;
    const temperature = options.temperature || 0.7;

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: options.systemPrompt,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      const metrics = this.calculateMetrics(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      this.totalCost += metrics.cost;

      // Check budget alert
      if (this.totalCost >= this.budgetAlert) {
        console.warn(`⚠️  BUDGET ALERT: Total AI cost has reached $${this.totalCost.toFixed(2)}`);
        this.budgetAlert += 100; // Next alert at next $100
      }

      console.log(`[Claude ${model}] Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out | Cost: $${metrics.cost.toFixed(4)} | Total: $${this.totalCost.toFixed(2)}`);

      return { content, metrics };
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Failed to query Claude: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async queryWithStructuredOutput<T>(
    prompt: string,
    options: {
      model?: ClaudeModel;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<{ data: T; metrics: AIUsageMetrics }> {
    const { content, metrics } = await this.query(prompt, {
      ...options,
      systemPrompt: `${options.systemPrompt || ''}\n\nReturn your response as valid JSON only, with no other text.`,
    });

    try {
      // Extract JSON from response (handle cases where Claude adds explanation)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const data = JSON.parse(jsonStr) as T;
      return { data, metrics };
    } catch (error) {
      console.error('Failed to parse JSON response:', content);
      throw new Error('Invalid JSON response from Claude');
    }
  }

  private calculateMetrics(
    model: ClaudeModel,
    inputTokens: number,
    outputTokens: number
  ): AIUsageMetrics {
    const costs = MODEL_COSTS[model];
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    const totalCost = inputCost + outputCost;

    return {
      model,
      inputTokens,
      outputTokens,
      cost: totalCost,
    };
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  resetCostTracking(): void {
    this.totalCost = 0;
    this.budgetAlert = 100;
  }
}

// Singleton instance
let claudeClient: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!claudeClient) {
    claudeClient = new ClaudeClient();
  }
  return claudeClient;
}
