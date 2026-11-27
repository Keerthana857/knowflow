import { AsyncLocalStorage } from 'async_hooks';

/**
 * Grok (xAI) / Groq OpenAI-compatible API Client
 * Uses GROK_API_KEY from env or per-request x-grok-key override (from Settings).
 */

export type GrokStatus = 'ok' | 'missing' | 'invalid_key' | 'out_of_credits' | 'network_error';

const requestKeyStorage = new AsyncLocalStorage<string | undefined>();

export function runWithGrokKey<T>(headerKey: string | null | undefined, fn: () => Promise<T>): Promise<T> {
  const cleaned = (headerKey || '').trim().replace(/^['"]|['"]$/g, '');
  return requestKeyStorage.run(cleaned || undefined, fn);
}

export function getGrokApiKey(): string | null {
  const override = requestKeyStorage.getStore();
  const raw = override || process.env.GROK_API_KEY;
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned === 'your_grok_api_key_here') return null;
  return cleaned;
}

function resolveProvider(apiKey: string): { endpoint: string; models: string[]; providerName: string } {
  if (apiKey.startsWith('gsk_')) {
    return {
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      models: [process.env.GROK_MODEL || 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      providerName: 'Groq'
    };
  }
  return {
    endpoint: process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions',
    models: [process.env.GROK_MODEL || 'grok-3-mini', 'grok-3-latest', 'grok-2-latest'],
    providerName: 'Grok (xAI)'
  };
}

export async function callGrokChat(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<{ ok: boolean; content?: string; status: GrokStatus; error?: string }> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 'missing',
      error: 'GROK_API_KEY is not set. Add an xai-... key in Settings or .env.local / Vercel.'
    };
  }

  const { endpoint, models, providerName } = resolveProvider(apiKey);

  try {
    let lastError = 'Unknown error';
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt }
        ],
        max_tokens: params.maxTokens ?? 700,
        temperature: params.temperature ?? 0.3
      };

      if (params.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          return { ok: false, status: 'network_error', error: `Empty response from ${providerName}.` };
        }
        return { ok: true, status: 'ok', content: String(content).trim() };
      }

      const errText = await res.text().catch(() => '');
      const lower = errText.toLowerCase();

      // If this specific model isn't found on the account, try next fallback model
      if (res.status === 404 && lower.includes('model') && i < models.length - 1) {
        lastError = errText;
        continue;
      }

      if (res.status === 402 || res.status === 429 || lower.includes('credit') || lower.includes('quota') || lower.includes('limit')) {
        return {
          ok: false,
          status: 'out_of_credits',
          error: `${providerName} credits exhausted or rate-limited (HTTP ${res.status}). Paste a new key in Settings.`
        };
      }

      if (res.status === 400 || res.status === 401 || res.status === 403 || lower.includes('incorrect api key') || lower.includes('invalid')) {
        return {
          ok: false,
          status: 'invalid_key',
          error: `${providerName} key rejected (HTTP ${res.status}). Paste a valid xai-... key from console.x.ai (or gsk_... Groq key) in Settings.`
        };
      }

      lastError = `${providerName} HTTP ${res.status}: ${errText.slice(0, 140)}`;
      break;
    }

    return { ok: false, status: 'network_error', error: lastError };
  } catch (err: any) {
    return {
      ok: false,
      status: 'network_error',
      error: err?.message || 'Grok network error.'
    };
  }
}

export async function callGrokJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ ok: boolean; data?: T; status: GrokStatus; error?: string }> {
  const result = await callGrokChat({
    ...params,
    jsonMode: true,
    temperature: 0.2
  });

  if (!result.ok || !result.content) {
    return { ok: false, status: result.status, error: result.error };
  }

  try {
    const cleaned = result.content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as T;
    return { ok: true, status: 'ok', data: parsed };
  } catch (err: any) {
    return { ok: false, status: 'network_error', error: `JSON parse failed: ${err?.message}` };
  }
}

export async function verifyGrokApiKey(): Promise<{ ok: boolean; status: GrokStatus; message: string }> {
  const res = await callGrokChat({
    systemPrompt: 'Reply OK.',
    userPrompt: 'Ping',
    maxTokens: 5
  });
  if (res.ok) {
    return { ok: true, status: 'ok', message: 'Connected & Working' };
  }
  return {
    ok: false,
    status: res.status,
    message: res.error || 'Key check failed'
  };
}
