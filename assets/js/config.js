export const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const CONFIG = {
    ASSET: "USDT",
    ROWS: 15,
    CACHE_TTL: 60000,
    MIN_MONTH_ORDERS: 50,
    MIN_FINISH_RATE: 95
  };

const COOLDOWN_STORAGE_KEY = 'p2p-cooldown-timestamp';
const LAST_REFRESH_STORAGE_KEY = 'p2p-last-refresh';

export function saveCooldownTimestamp() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(COOLDOWN_STORAGE_KEY, Date.now().toString());
    } catch (e) {
      console.warn('[Storage] Failed to save cooldown timestamp:', e);
    }
  }
}

export function getCooldownRemaining() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  try {
    const savedTimestamp = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (!savedTimestamp) {
      return 0;
    }
    const timestamp = parseInt(savedTimestamp, 10);
    if (isNaN(timestamp)) {
      return 0;
    }
    const now = Date.now();
    const elapsed = Math.floor((now - timestamp) / 1000);
    const cooldownSeconds = Math.floor(CONFIG.CACHE_TTL / 1000);
    const remaining = Math.max(0, cooldownSeconds - elapsed);
    return remaining;
  } catch (e) {
    console.warn('[Storage] Failed to get cooldown remaining:', e);
    return 0;
  }
}

export function clearCooldownTimestamp() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(COOLDOWN_STORAGE_KEY);
    } catch (e) {
      console.warn('[Storage] Failed to clear cooldown timestamp:', e);
    }
  }
}

export function saveLastRefreshTimestamp() {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(LAST_REFRESH_STORAGE_KEY, Date.now().toString());
    } catch (e) {
      console.warn('[Storage] Failed to save last refresh timestamp:', e);
    }
  }
}