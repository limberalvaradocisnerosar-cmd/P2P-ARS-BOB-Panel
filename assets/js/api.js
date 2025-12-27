import { CONFIG } from './config.js';

// SECURITY: Usar proxy de Vercel para evitar CORS
// En desarrollo, usar localhost. En producción, usar el dominio de Vercel
const getProxyUrl = () => {
  if (typeof window === 'undefined') {
    return '/api/proxy';
  }
  
  // Detectar si estamos en producción (Vercel)
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('vercel.app') || hostname.includes('vercel.com');
  
  if (isProduction) {
    // En producción, usar ruta relativa (Vercel maneja el routing)
    return '/api/proxy';
  }
  
  // En desarrollo local
  return 'http://localhost:3000/api/proxy';
};

const PROXY_URL = getProxyUrl();

// Security: Guard flags
let isUserTriggered = false;
let isFetchAllowed = false;

/**
 * SECURITY: Enable fetch only when explicitly triggered by user action
 * This function MUST be called before any fetch attempt
 */
export function enableFetchForUserAction() {
  isUserTriggered = true;
  isFetchAllowed = true;
}

/**
 * SECURITY: Disable fetch after operation completes
 */
export function disableFetchAfterOperation() {
  isUserTriggered = false;
  isFetchAllowed = false;
}

/**
 * SECURITY: Check if fetch is allowed
 * Returns false if:
 * - Not user triggered
 * - Fetch already in progress
 * - Cooldown active
 */
export function isFetchAllowedCheck() {
  return isFetchAllowed && isUserTriggered;
}

/**
 * SECURITY: Sanitize and validate price value
 */
function sanitizePrice(price) {
  if (typeof price !== 'number' && typeof price !== 'string') {
    return null;
  }
  
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  // Reject invalid values
  if (isNaN(num) || !isFinite(num) || num <= 0) {
    return null;
  }
  
  // Reject extreme values (potential manipulation)
  if (num > 1000000000 || num < 0.000001) {
    return null;
  }
  
  return num;
}

/**
 * SECURITY: Sanitize and validate advertiser data
 */
function sanitizeAdvertiser(advertiser) {
  if (!advertiser || typeof advertiser !== 'object') {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  
  const monthOrderCount = parseInt(advertiser.monthOrderCount) || 0;
  const monthFinishRate = parseFloat(advertiser.monthFinishRate) || 0;
  
  // Validate ranges
  if (monthOrderCount < 0 || monthOrderCount > 1000000) {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  
  if (monthFinishRate < 0 || monthFinishRate > 100) {
    return { monthOrderCount: 0, monthFinishRate: 0 };
  }
  
  return { monthOrderCount, monthFinishRate };
}

/**
 * SECURITY: Main fetch function with defensive guards
 * This is the ONLY function that should call the Binance P2P endpoint
 */
export async function fetchPrices({ fiat, tradeType }) {
  // SECURITY: Guard check - abort if not user triggered
  if (!isFetchAllowedCheck()) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Production: silent abort
      throw new Error('Fetch not allowed');
    } else {
      // Development: log for debugging
      console.warn('[SECURITY] Fetch blocked: Not user triggered');
      throw new Error('Fetch not allowed');
    }
  }
  
  // SECURITY: Validate inputs
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
    // SECURITY: Usar proxy de Vercel en lugar de llamar directamente a Binance
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

    // SECURITY: Sanitize all ads
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
  } catch (error) {
    // SECURITY: Log errors only in development
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.error('[API] Error fetching prices:', error);
    }
    throw error;
  }
}
