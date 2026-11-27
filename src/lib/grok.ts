/**
 * Grok (xAI) API Client
 * Uses GROK_API_KEY exclusively (no Gemini or OpenAI).
 * Designed for low-credit consumption with compact prompts and strict token limits.
 */

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
}): Promise<{ ok: boolean; content?: string; error?: string }> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    return { ok: false, error: 'GROK_API_KEY not configured' };
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
      return { ok: false, error: `Grok API HTTP ${res.status}: ${errText.slice(0, 180)}` };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: 'Empty response from Grok' };
    }

    return { ok: true, content: String(content).trim() };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Grok network error' };
  }
}

export async function callGrokJson<T>(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<{ ok: boolean; data?: T; error?: string }> {
  const result = await callGrokChat({
    ...params,
    jsonMode: true,
    temperature: 0.2
  });

  if (!result.ok || !result.content) {
    return { ok: false, error: result.error };
  }

  try {
    // Strip markdown code fences if present
    const cleaned = result.content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as T;
    return { ok: true, data: parsed };
  } catch (err: any) {
    return { ok: false, error: `JSON parse failed: ${err?.message}` };
  }
}
