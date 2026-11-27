export const GROK_KEY_STORAGE = 'knowflow_custom_grok_key';

export function getSavedGrokKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(GROK_KEY_STORAGE) || '').trim();
  } catch {
    return '';
  }
}

export function saveCustomGrokKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = key.trim();
    if (cleaned) {
      window.localStorage.setItem(GROK_KEY_STORAGE, cleaned);
    } else {
      window.localStorage.removeItem(GROK_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

export function getGrokHeaders(): Record<string, string> {
  const custom = getSavedGrokKey();
  return custom ? { 'x-grok-key': custom } : {};
}
