export const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const CONFIG = {
    ASSET: "USDT",
    ROWS: 15,
    CACHE_TTL: 60000,
    MIN_MONTH_ORDERS: 50,
    MIN_FINISH_RATE: 95
  };

export const COOLDOWN_MS = 60_000;

export function setCookie(name, value, maxAgeSeconds) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1] || null;
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
}

export function hasConsent() {
  return getCookie('p2p_consent') === 'true';
}

export function setConsent() {
  const oneYear = 60 * 60 * 24 * 365;
  setCookie('p2p_consent', 'true', oneYear);
}

export function getRemainingCooldown() {
  const lastFetch = getCookie('p2p_last_fetch');
  if (!lastFetch) return 0;
  const timestamp = Number(lastFetch);
  if (!timestamp || isNaN(timestamp)) return 0;
  const elapsed = Date.now() - timestamp;
  return Math.max(COOLDOWN_MS - elapsed, 0);
}

export function saveLastFetchTimestamp() {
  const oneDay = 60 * 60 * 24;
  setCookie('p2p_last_fetch', Date.now().toString(), oneDay);
}