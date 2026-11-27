export const GROK_KEY_STORAGE = 'knowflow_custom_grok_key_v2';
const LEGACY_GROK_KEY_STORAGE = 'knowflow_custom_grok_key';

export function getSavedGrokKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    // Auto-clean legacy invalid grok_ overrides from previous sessions
    if (window.localStorage.getItem(LEGACY_GROK_KEY_STORAGE)) {
      window.localStorage.removeItem(LEGACY_GROK_KEY_STORAGE);
    }
    const val = (window.localStorage.getItem(GROK_KEY_STORAGE) || '').trim();
    if (val.startsWith('grok_')) {
      window.localStorage.removeItem(GROK_KEY_STORAGE);
      return '';
    }
    return val;
  } catch {
    return '';
  }
}

export function saveCustomGrokKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(LEGACY_GROK_KEY_STORAGE);
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
