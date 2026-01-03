import { CONFIG } from './config.js';
const cache = new Map();
export function getCache(key) {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }
  const now = Date.now();
  const age = now - cached.timestamp;
  if (age > CONFIG.CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return cached.data;
}
export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}
export function clearCache() {
  cache.clear();
}