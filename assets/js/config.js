export const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const CONFIG = {
    ASSET: "USDT",
    ROWS: 15,
    CACHE_TTL: 60000,
    MIN_MONTH_ORDERS: 50,
    MIN_FINISH_RATE: 95
  };