import { CONFIG } from './config.js';
import { warn, error } from './logger.js';

const getProxyUrl = () => {
  if (typeof window === 'undefined') {
    return '/api/proxy';
  }
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalhost) {
    return 'http://localhost:3000/api/proxy';
  }
  return '/api/proxy';
};
const PROXY_URL = getProxyUrl();
let isUserTriggered = false;
let isFetchAllowed = false;
export function enableFetchForUserAction() {
  isUserTriggered = true;
  isFetchAllowed = true;
}
export function disableFetchAfterOperation() {
  isUserTriggered = false;
  isFetchAllowed = false;
}
export function isFetchAllowedCheck() {
  return isFetchAllowed && isUserTriggered;
}
function sanitizePrice(price) {
  if (typeof price !== 'number' && typeof price !== 'string') {
    return null;
  }
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return null;
  }
  if (num > 1000000000 || num < 0.000001) {
    return null;
  }
  return num;
}
function sanitizeAdvertiser(advertiser) {
  if (!advertiser || typeof advertiser !== 'object') {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  const monthOrderCount = parseInt(advertiser.monthOrderCount) || 0;
  const monthFinishRate = parseFloat(advertiser.monthFinishRate) || 0;
  if (monthOrderCount < 0 || monthOrderCount > 1000000) {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  if (monthFinishRate < 0 || monthFinishRate > 100) {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  return { monthOrderCount, monthFinishRate };
}
export async function fetchPrices({ fiat, tradeType }) {
  if (!isFetchAllowedCheck()) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      throw new Error('Fetch not allowed');
    } else {
      warn('[SECURITY] Fetch blocked: Not user triggered');
      throw new Error('Fetch not allowed');
    }
  }
  if (!fiat || !tradeType) {
    throw new Error('Invalid fetch parameters');
  }
  if (!['ARS', 'BOB'].includes(fiat)) {
    throw new Error('Invalid fiat currency');
  }
  if (!['BUY', 'SELL'].includes(tradeType)) {
    throw new Error('Invalid trade type');
  }
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: CONFIG.ASSET,
        fiat: fiat,
        merchantCheck: false,
        page: 1,
        payTypes: [],
        publisherType: null,
        rows: CONFIG.ROWS,
        tradeType: tradeType,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data?.data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format');
    }
    const ads = data.data
      .map(ad => {
        if (!ad || !ad.adv) {
          return null;
        }
        const price = sanitizePrice(ad.adv.price);
        if (price === null) {
          return null;
        }
        const advertiser = sanitizeAdvertiser(ad.advertiser);
        return {
          price: price,
          monthOrderCount: advertiser.monthOrderCount,
          monthFinishRate: advertiser.monthFinishRate
        };
      })
      .filter(ad => ad !== null);
    if (ads.length === 0) {
      throw new Error('No valid prices found');
    }
    return ads;
  } catch (err) {
    error('[API] Error fetching prices:', err);
    throw err;
  }
}