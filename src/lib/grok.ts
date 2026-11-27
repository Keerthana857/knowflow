/**
 * Grok (xAI) API Client
 * Uses GROK_API_KEY exclusively (no Gemini or OpenAI).
 * Reports exact invalid_key / out_of_credits status so the user knows immediately when to replace the key.
 */

export type GrokStatus = 'ok' | 'missing' | 'invalid_key' | 'out_of_credits' | 'network_error';

export function getGrokApiKey(): string | null {
  const raw = process.env.GROK_API_KEY;
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned === 'your_grok_api_key_here') return null;
  return cleaned;
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
      error: 'GROK_API_KEY is not set in .env.local / Vercel Environment Variables.'
    };
  }

  const endpoint = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
  const model = process.env.GROK_MODEL || 'grok-3-mini';

  try {
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

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const lower = errText.toLowerCase();

      if (res.status === 402 || res.status === 429 || lower.includes('credit') || lower.includes('quota') || lower.includes('limit')) {
        return {
          ok: false,
          status: 'out_of_credits',
          error: `Grok API credits exhausted or rate-limited (HTTP ${res.status}). Add a new GROK_API_KEY.`
        };
      }

      if (res.status === 400 || res.status === 401 || res.status === 403 || lower.includes('incorrect api key') || lower.includes('invalid')) {
        return {
          ok: false,
          status: 'invalid_key',
          error: `Grok API key rejected (HTTP ${res.status}). Please replace GROK_API_KEY with a valid xai-... key from console.x.ai.`
        };
      }

      return {
        ok: false,
        status: 'network_error',
        error: `Grok API HTTP ${res.status}: ${errText.slice(0, 140)}`
      };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, status: 'network_error', error: 'Empty response from Grok.' };
    }

    return { ok: true, status: 'ok', content: String(content).trim() };
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
