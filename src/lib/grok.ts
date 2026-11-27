import { AsyncLocalStorage } from 'async_hooks';

/**
 * Grok (xAI) / Groq / OpenRouter OpenAI-compatible API Client
 * Uses GROK_API_KEY from env or per-request x-grok-key override (from Settings).
 */

export type GrokStatus = 'ok' | 'missing' | 'invalid_key' | 'out_of_credits' | 'network_error';

const requestKeyStorage = new AsyncLocalStorage<string | undefined>();

function sanitizeKey(raw: string | null | undefined): string {
  return (raw || '')
    .trim()
    .replace(/^GROK_API_KEY=/i, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

export function runWithGrokKey<T>(headerKey: string | null | undefined, fn: () => Promise<T>): Promise<T> {
  const cleaned = sanitizeKey(headerKey);
  return requestKeyStorage.run(cleaned || undefined, fn);
}

export function getGrokApiKey(): string | null {
  const override = requestKeyStorage.getStore();
  const cleaned = sanitizeKey(override || process.env.GROK_API_KEY);
  if (!cleaned || cleaned === 'your_grok_api_key_here') return null;
  return cleaned;
}

function resolveProvider(apiKey: string): {
  baseUrl: string;
  defaultModels: string[];
  providerName: string;
} {
  if (apiKey.startsWith('gsk_')) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1',
      defaultModels: [process.env.GROK_MODEL || 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      providerName: 'Groq'
    };
  }
  if (apiKey.startsWith('sk-or-')) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      defaultModels: [process.env.GROK_MODEL || 'x-ai/grok-3-mini', 'meta-llama/llama-3.3-70b-instruct:free'],
      providerName: 'OpenRouter'
    };
  }
  return {
    baseUrl: (process.env.GROK_API_URL || 'https://api.x.ai/v1').replace(/\/chat\/completions\/?$/, ''),
    defaultModels: [
      ...(process.env.GROK_MODEL ? [process.env.GROK_MODEL] : []),
      'latest',
      'grok-4.7',
      'grok-4-fast',
      'grok-4',
      'grok-3-mini',
      'grok-3',
      'grok-2-latest'
    ],
    providerName: 'Grok (xAI)'
  };
}

function parseProviderError(rawText: string): string {
  try {
    const parsed = JSON.parse(rawText);
    const msg = parsed?.error?.message || parsed?.error || parsed?.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  } catch {
    // non-JSON body
  }
  return rawText.trim().slice(0, 180);
}

const discoveredModelsCache = new Map<string, { models: string[]; ts: number }>();

async function discoverModels(
  baseUrl: string,
  apiKey: string
): Promise<{ models: string[]; authError?: { status: number; message: string } }> {
  const cacheKey = `${baseUrl}:${apiKey.slice(0, 12)}:${apiKey.slice(-6)}`;
  const cached = discoveredModelsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
    return { models: cached.models };
  }

  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return {
        models: [],
        authError: { status: res.status, message: parseProviderError(errText) || `HTTP ${res.status}` }
      };
    }

    const data = await res.json();
    const list: string[] = Array.isArray(data?.data)
      ? data.data
          .map((m: any) => String(m?.id || ''))
          .filter(
            (id: string) =>
              id &&
              !/image|imagine|video|audio|voice|whisper|tts|guard|embed/i.test(id)
          )
      : [];

    // Rank fast / current chat models first
    list.sort((a, b) => {
      const score = (id: string) => {
        if (id === 'latest') return 100;
        if (/grok-4\.7|grok-4-fast|grok-3-mini/i.test(id)) return 90;
        if (/grok-4|grok-3|llama-3\.3/i.test(id)) return 80;
        return 10;
      };
      return score(b) - score(a);
    });

    if (list.length > 0) {
      discoveredModelsCache.set(cacheKey, { models: list.slice(0, 5), ts: Date.now() });
    }
    return { models: list.slice(0, 5) };
  } catch {
    return { models: [] };
  }
}

export async function callGrokChat(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}): Promise<{ ok: boolean; content?: string; status: GrokStatus; error?: string }> {
  const overrideKey = sanitizeKey(requestKeyStorage.getStore());
  const envKey = sanitizeKey(process.env.GROK_API_KEY);
  const validEnvKey = envKey && envKey !== 'your_grok_api_key_here' ? envKey : '';

  // Ignore clearly invalid legacy grok_ browser overrides when a valid server env key exists
  const primaryKey =
    overrideKey && !(overrideKey.startsWith('grok_') && validEnvKey)
      ? overrideKey
      : validEnvKey;

  if (!primaryKey) {
    return {
      ok: false,
      status: 'missing',
      error: 'GROK_API_KEY is not set. Add an xai-... or gsk_... key in Settings or .env.local.'
    };
  }

  const firstAttempt = await executeChatWithKey(primaryKey, params);
  if (
    !firstAttempt.ok &&
    firstAttempt.status === 'invalid_key' &&
    overrideKey &&
    validEnvKey &&
    overrideKey !== validEnvKey
  ) {
    return executeChatWithKey(validEnvKey, params);
  }
  return firstAttempt;
}

async function executeChatWithKey(
  apiKey: string,
  params: {
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<{ ok: boolean; content?: string; status: GrokStatus; error?: string }> {
  const { baseUrl, defaultModels, providerName } = resolveProvider(apiKey);
  const { models: liveModels, authError } = await discoverModels(baseUrl, apiKey);

  if (authError && [400, 401, 403].includes(authError.status)) {
    const lower = authError.message.toLowerCase();
    if (lower.includes('credit') || lower.includes('quota') || lower.includes('billing') || lower.includes('balance')) {
      return {
        ok: false,
        status: 'out_of_credits',
        error: `${providerName} billing/credits issue (HTTP ${authError.status}): ${authError.message}`
      };
    }
    return {
      ok: false,
      status: 'invalid_key',
      error: `${providerName} key rejected (HTTP ${authError.status}): ${authError.message}`
    };
  }

  const candidateModels = Array.from(new Set([...liveModels, ...defaultModels]));

  try {
    let lastError = 'Unknown error';
    for (let i = 0; i < candidateModels.length; i++) {
      const model = candidateModels[i];
      const body: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: params.systemPrompt },
          { role: 'user', content: params.userPrompt }
        ],
        max_tokens: Math.max(16, params.maxTokens ?? 700),
        temperature: params.temperature ?? 0.3
      };

      if (params.jsonMode) {
        body.response_format = { type: 'json_object' };
      }

      const res = await fetch(`${baseUrl}/chat/completions`, {
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
      const cleanMsg = parseProviderError(errText);
      const lower = cleanMsg.toLowerCase();

      // Retry next fallback model if the failure is model/parameter related (NOT key/credit failure)
      const isModelOrParamErr =
        res.status === 404 ||
        (res.status === 400 &&
          (lower.includes('model') ||
            lower.includes('not found') ||
            lower.includes('response_format') ||
            lower.includes('unsupported')));

      if (isModelOrParamErr && i < candidateModels.length - 1) {
        lastError = `${model}: ${cleanMsg}`;
        continue;
      }

      if (
        res.status === 402 ||
        res.status === 429 ||
        lower.includes('credit') ||
        lower.includes('quota') ||
        lower.includes('billing') ||
        lower.includes('limit')
      ) {
        return {
          ok: false,
          status: 'out_of_credits',
          error: `${providerName} credits/quota issue (HTTP ${res.status}): ${cleanMsg}`
        };
      }

      if (res.status === 400 || res.status === 401 || res.status === 403) {
        return {
          ok: false,
          status: 'invalid_key',
          error: `${providerName} rejected key (HTTP ${res.status}): ${cleanMsg}`
        };
      }

      lastError = `${providerName} HTTP ${res.status}: ${cleanMsg}`;
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
    maxTokens: 16
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
