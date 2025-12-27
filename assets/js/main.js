import { CONFIG } from './config.js';
import { fetchPrices, enableFetchForUserAction, disableFetchAfterOperation, isFetchAllowedCheck } from './api.js';
import { median, arsToBob, bobToArs, formatNumber, filterAds, removeOutliers } from './calc.js';
import { getCache, setCache, clearCache } from './cache.js';
import { setResult, setLoading, setError, getAmount, getDirection, setupInputListeners, setRefreshButtonLoading, renderInfoCard, renderReferencePrices, renderReferenceTable, setupReferencePricesToggle, startRefreshCountdown } from './ui.js';

// SECURITY: Development mode detection
const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

let pricesState = {
  ars: { buy: null, sell: null },
  bob: { buy: null, sell: null },
  timestamp: null
};

let referencePricesState = {
  ars_buy: [],
  ars_sell: [],
  bob_buy: [],
  bob_sell: [],
  timestamp: null
};

// SECURITY: Global guards
let isRefreshing = false;
let isCooldown = false;
let lastFetchTimestamp = 0;
const MIN_FETCH_INTERVAL = 60000; // 60 seconds minimum between fetches

function clearPricesState() {
  pricesState = {
    ars: { buy: null, sell: null },
    bob: { buy: null, sell: null },
    timestamp: null
  };
  referencePricesState = {
    ars_buy: [],
    ars_sell: [],
    bob_buy: [],
    bob_sell: [],
    timestamp: null
  };
  window.currentReferencePrices = null;
  if (IS_DEV) {
    console.log('[SECURITY] PricesState cleared');
  }
}

function updatePricesState(arsBuy, arsSell, bobBuy, bobSell) {
  // SECURITY: Validate all prices before updating state
  if (typeof arsBuy !== 'number' || !isFinite(arsBuy) || arsBuy <= 0) {
    throw new Error('Invalid ARS BUY price');
  }
  if (typeof arsSell !== 'number' || !isFinite(arsSell) || arsSell <= 0) {
    throw new Error('Invalid ARS SELL price');
  }
  if (typeof bobBuy !== 'number' || !isFinite(bobBuy) || bobBuy <= 0) {
    throw new Error('Invalid BOB BUY price');
  }
  if (typeof bobSell !== 'number' || !isFinite(bobSell) || bobSell <= 0) {
    throw new Error('Invalid BOB SELL price');
  }
  
  pricesState.ars.buy = arsBuy;
  pricesState.ars.sell = arsSell;
  pricesState.bob.buy = bobBuy;
  pricesState.bob.sell = bobSell;
  pricesState.timestamp = new Date();
  
  if (IS_DEV) {
    console.log('[STATE] PricesState updated', pricesState);
  }
}

function loadPricesStateFromCache() {
  const arsBuy = getCache('ARS_BUY');
  const arsSell = getCache('ARS_SELL');
  const bobBuy = getCache('BOB_BUY');
  const bobSell = getCache('BOB_SELL');

  // SECURITY: Validate cached data before using
  if (arsBuy !== null && arsSell !== null && bobBuy !== null && bobSell !== null) {
    // Validate all cached values are valid numbers
    if (
      typeof arsBuy === 'number' && isFinite(arsBuy) && arsBuy > 0 &&
      typeof arsSell === 'number' && isFinite(arsSell) && arsSell > 0 &&
      typeof bobBuy === 'number' && isFinite(bobBuy) && bobBuy > 0 &&
      typeof bobSell === 'number' && isFinite(bobSell) && bobSell > 0
    ) {
      pricesState.ars.buy = arsBuy;
      pricesState.ars.sell = arsSell;
      pricesState.bob.buy = bobBuy;
      pricesState.bob.sell = bobSell;
      pricesState.timestamp = new Date();
      
      if (IS_DEV) {
        console.log('[CACHE] PricesState loaded from cache', pricesState);
      }
      
      window.currentReferencePrices = null;
      return true;
    } else {
      // Invalid cache data - clear it
      if (IS_DEV) {
        console.warn('[SECURITY] Invalid cached data detected, clearing cache');
      }
      clearCache();
    }
  }
  return false;
}

function renderAllUI() {
  const priceDataForUI = {
    ARS: {
      BUY: { median: pricesState.ars.buy, best: pricesState.ars.buy },
      SELL: { median: pricesState.ars.sell, best: pricesState.ars.sell }
    },
    BOB: {
      BUY: { median: pricesState.bob.buy, best: pricesState.bob.buy },
      SELL: { median: pricesState.bob.sell, best: pricesState.bob.sell }
    }
  };

  renderInfoCard(priceDataForUI);
  renderReferencePrices(priceDataForUI, pricesState.timestamp);
  
  if (window.currentReferencePrices) {
    renderReferenceTable(window.currentReferencePrices);
  }
  
  if (IS_DEV) {
    console.log('[UI] All UI rendered from pricesState');
  }
}

/**
 * SECURITY: Enhanced price processing with outlier defense
 */
async function fetchAndProcessPrice(fiat, tradeType) {
  if (IS_DEV) {
    console.log(`[FETCH] Fetching prices for ${fiat} ${tradeType}`);
  }
  
  const ads = await fetchPrices({ fiat, tradeType });
  
  if (!ads || !Array.isArray(ads) || ads.length === 0) {
    throw new Error(`No ads returned for ${fiat} ${tradeType}`);
  }
  
  // SECURITY: Filter ads by quality metrics
  const filteredAds = filterAds(ads, CONFIG.MIN_MONTH_ORDERS, CONFIG.MIN_FINISH_RATE);
  
  let prices;
  if (filteredAds.length === 0) {
    if (IS_DEV) {
      console.warn(`[SECURITY] No ads passed filter for ${fiat} ${tradeType}, using all ads`);
    }
    prices = ads.map(ad => ad.price).filter(p => typeof p === 'number' && isFinite(p) && p > 0);
  } else {
    prices = filteredAds.map(ad => ad.price).filter(p => typeof p === 'number' && isFinite(p) && p > 0);
  }
  
  if (prices.length === 0) {
    throw new Error(`No valid prices found for ${fiat} ${tradeType}`);
  }
  
  // SECURITY: Remove outliers (defense against manipulation)
  const pricesWithoutOutliers = removeOutliers(prices);
  const finalPrices = pricesWithoutOutliers.length > 0 ? pricesWithoutOutliers : prices;
  
  // SECURITY: Limit to first 5 valid prices (fixed sample size)
  const limitedPrices = finalPrices.slice(0, 5);
  
  if (limitedPrices.length === 0) {
    throw new Error(`No prices remaining after processing for ${fiat} ${tradeType}`);
  }
  
  // SECURITY: Validate median result
  const medianPrice = median(limitedPrices);
  if (typeof medianPrice !== 'number' || !isFinite(medianPrice) || medianPrice <= 0) {
    throw new Error(`Invalid median price calculated for ${fiat} ${tradeType}`);
  }
  
  const timestamp = Date.now();
  
  const referencePrices = limitedPrices.map(price => ({
    price: price,
    timestamp: timestamp
  }));
  
  if (IS_DEV) {
    console.log(`[FETCH] Prices processed for ${fiat} ${tradeType}:`, medianPrice, `(${limitedPrices.length} prices)`);
  }
  
  return { medianPrice, referencePrices };
}

/**
 * SECURITY: Main fetch function with comprehensive guards
 * This is the ONLY function that should trigger API calls
 */
async function fetchAllPricesFromAPI() {
  // SECURITY: Double-check fetch is allowed
  if (!isFetchAllowedCheck()) {
    throw new Error('Fetch not allowed - security guard');
  }
  
  // SECURITY: Rate limiting check
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTimestamp;
  if (lastFetchTimestamp > 0 && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
    const remaining = Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000);
    throw new Error(`Rate limit: Please wait ${remaining} seconds before refreshing again`);
  }
  
  if (IS_DEV) {
    console.log('[FETCH] Fetching all prices from Binance P2P');
  }
  
  try {
    const [arsBuyData, arsSellData, bobBuyData, bobSellData] = await Promise.all([
      fetchAndProcessPrice('ARS', 'BUY'),
      fetchAndProcessPrice('ARS', 'SELL'),
      fetchAndProcessPrice('BOB', 'BUY'),
      fetchAndProcessPrice('BOB', 'SELL')
    ]);

    clearCache();

    const arsBuy = arsBuyData.medianPrice;
    const arsSell = arsSellData.medianPrice;
    const bobBuy = bobBuyData.medianPrice;
    const bobSell = bobSellData.medianPrice;

    // SECURITY: Validate all prices before caching
    if (
      typeof arsBuy !== 'number' || !isFinite(arsBuy) || arsBuy <= 0 ||
      typeof arsSell !== 'number' || !isFinite(arsSell) || arsSell <= 0 ||
      typeof bobBuy !== 'number' || !isFinite(bobBuy) || bobBuy <= 0 ||
      typeof bobSell !== 'number' || !isFinite(bobSell) || bobSell <= 0
    ) {
      throw new Error('Invalid prices received from API');
    }

    setCache('ARS_BUY', arsBuy);
    setCache('ARS_SELL', arsSell);
    setCache('BOB_BUY', bobBuy);
    setCache('BOB_SELL', bobSell);
    
    if (IS_DEV) {
      console.log('[CACHE] Cache updated with new snapshot');
    }

    updatePricesState(arsBuy, arsSell, bobBuy, bobSell);
    
    referencePricesState.ars_buy = arsBuyData.referencePrices;
    referencePricesState.ars_sell = arsSellData.referencePrices;
    referencePricesState.bob_buy = bobBuyData.referencePrices;
    referencePricesState.bob_sell = bobSellData.referencePrices;
    referencePricesState.timestamp = new Date();
    
    if (IS_DEV) {
      console.log('[STATE] ReferencePricesState updated');
    }
    
    window.currentReferencePrices = referencePricesState;
    
    // SECURITY: Update last fetch timestamp
    lastFetchTimestamp = Date.now();
    
    return { arsBuy, arsSell, bobBuy, bobSell };
  } catch (error) {
    // SECURITY: Fail-safe - keep last known prices
    if (IS_DEV) {
      console.error('[FETCH] Error in fetchAllPricesFromAPI:', error);
    }
    throw error;
  }
}

/**
 * SECURITY: Cache-first policy - NEVER auto-fetch
 */
async function loadPrices(forceRefresh = false) {
  // SECURITY: forceRefresh should NEVER be true unless explicitly user-triggered
  // This function should only be called with forceRefresh=false from init()
  if (forceRefresh) {
    // This should never happen from init() - only from user click
    if (IS_DEV) {
      console.warn('[SECURITY] loadPrices called with forceRefresh=true - this should not happen');
    }
    return;
  }
  
  // SECURITY: Cache-first policy - NO auto-fetch
  const loadedFromCache = loadPricesStateFromCache();
  if (loadedFromCache) {
    if (IS_DEV) {
      console.log('[CACHE] Loaded prices from cache');
    }
    renderAllUI();
  } else {
    if (IS_DEV) {
      console.log('[CACHE] Cache empty or expired - waiting for manual refresh');
    }
    // SECURITY: Show message - do NOT auto-fetch
    setError('Precios no disponibles. Presiona "Actualizar Precios" para cargar.');
    renderReferencePrices(null, null);
    renderReferenceTable({ ars_buy: [], ars_sell: [], bob_buy: [], bob_sell: [], timestamp: null });
  }
}

/**
 * SECURITY: Input sanitization and validation
 */
async function calculateConversion() {
  const amount = getAmount();
  const direction = getDirection();

  // SECURITY: Validate amount
  if (typeof amount !== 'number' || !isFinite(amount) || amount <= 0) {
    setResult('—');
    return;
  }
  
  // SECURITY: Prevent extremely large numbers (potential abuse)
  if (amount > 1000000000000) { // 1 trillion max
    setError('Monto demasiado grande. Por favor, ingresa un monto válido.');
    return;
  }

  if (amount === 0) {
    setResult('—');
    return;
  }

  if (!pricesState.ars.buy || !pricesState.ars.sell || !pricesState.bob.buy || !pricesState.bob.sell) {
    setError('Precios no disponibles. Por favor, actualiza los precios.');
    return;
  }

  setLoading(true);

  try {
    let result = 0;
    let currency = '';

    if (direction === 'ARS_BOB') {
      result = arsToBob(amount, pricesState.ars.buy, pricesState.bob.sell);
      currency = 'BOB';
    } else if (direction === 'BOB_ARS') {
      result = bobToArs(amount, pricesState.bob.buy, pricesState.ars.sell);
      currency = 'ARS';
    } else {
      throw new Error('Invalid direction');
    }

    // SECURITY: Validate result
    if (typeof result !== 'number' || !isFinite(result) || result <= 0) {
      throw new Error('Invalid calculation result');
    }

    const formatted = formatNumber(result, 2);
    setResult(`${formatted} ${currency}`);
  } catch (error) {
    if (IS_DEV) {
      console.error('[CALC] Error calculating conversion:', error);
    }
    setError('Error al calcular la conversión');
  } finally {
    setLoading(false);
  }
}

/**
 * SECURITY: Main refresh handler - ONLY entry point for API calls
 * This function is the ONLY place where fetch is allowed
 */
async function refreshPrices() {
  // SECURITY: This function MUST be called from user click event only
  if (IS_DEV) {
    console.log('[SECURITY] Refresh clicked by user');
  }
  
  // SECURITY: Multiple guard checks
  if (isRefreshing) {
    if (IS_DEV) {
      console.warn('[SECURITY] Refresh already in progress, ignoring click');
    }
    return;
  }
  
  if (isCooldown) {
    if (IS_DEV) {
      console.warn('[SECURITY] Cooldown active, ignoring click');
    }
    return;
  }
  
  // SECURITY: Enable fetch ONLY for this user action
  enableFetchForUserAction();
  
  // SECURITY: Activate lock IMMEDIATELY
  isRefreshing = true;
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.cursor = 'not-allowed';
  }
  
  setRefreshButtonLoading(true, null);
  
  try {
    clearCache();
    clearPricesState();
    window.currentReferencePrices = null;
    renderReferencePrices(null, null);
    
    if (IS_DEV) {
      console.log('[FETCH] Fetching prices from Binance P2P');
    }
    
    await fetchAllPricesFromAPI();
    
    if (IS_DEV) {
      console.log('[FETCH] Prices updated successfully');
    }
    
    renderAllUI();
    
    // Recalculate conversion if amount entered
    const amount = getAmount();
    if (amount > 0 && typeof amount === 'number' && isFinite(amount)) {
      await calculateConversion();
    } else {
      setResult('—');
    }
    
    // SECURITY: Start cooldown timer
    const countdownSeconds = Math.floor(CONFIG.CACHE_TTL / 1000);
    isCooldown = true;
    startRefreshCountdown(countdownSeconds, () => {
      if (IS_DEV) {
        console.log('[SECURITY] Cooldown completed, button unlocked');
      }
      isCooldown = false;
    });
  } catch (error) {
    // SECURITY: Fail-safe behavior - keep last known prices
    if (IS_DEV) {
      console.error('[FETCH] Error refreshing prices:', error);
    }
    
    // Show user-friendly error message
    const errorMessage = error.message || 'Error al actualizar precios';
    if (errorMessage.includes('Rate limit')) {
      setError(errorMessage);
    } else {
      setError('Error al actualizar precios. Intenta nuevamente.');
    }
    
    // SECURITY: On error, reset cooldown but keep lock until finally
    isCooldown = false;
    
    // SECURITY: Try to restore from cache if available
    const cached = loadPricesStateFromCache();
    if (cached) {
      renderAllUI();
      if (IS_DEV) {
        console.log('[CACHE] Restored prices from cache after error');
      }
    }
  } finally {
    // SECURITY: Disable fetch after operation
    disableFetchAfterOperation();
    
    // SECURITY: Release lock ALWAYS
    isRefreshing = false;
    
    // Re-enable button only if no cooldown active
    if (!isCooldown) {
      setRefreshButtonLoading(false);
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.style.cursor = 'pointer';
      }
    }
  }
}

/**
 * SECURITY: Initialization - NO fetch on load
 */
async function init() {
  if (IS_DEV) {
    console.log('[INIT] Initializing P2P Panel');
  }
  
  // SECURITY: Ensure fetch is disabled on init
  disableFetchAfterOperation();
  
  setupInputListeners(calculateConversion);
  setupReferencePricesToggle();
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    // SECURITY: Only allow refresh from explicit user click
    refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      refreshPrices();
    });
  }
  
  // Initialize empty UI
  renderReferencePrices(null, null);
  renderReferenceTable({ ars_buy: [], ars_sell: [], bob_buy: [], bob_sell: [], timestamp: null });
  
  // SECURITY: Cache-first policy - NO auto-fetch
  // loadPrices(false) will NEVER trigger fetch
  await loadPrices(false);
  
  // Try to calculate if cache data exists and amount entered
  const initialAmount = getAmount();
  if (
    initialAmount > 0 &&
    typeof initialAmount === 'number' &&
    isFinite(initialAmount) &&
    pricesState.ars.buy &&
    pricesState.ars.sell &&
    pricesState.bob.buy &&
    pricesState.bob.sell
  ) {
    await calculateConversion();
  } else {
    setResult('—');
  }
  
  if (IS_DEV) {
    console.log('[INIT] Initialization complete - fetch disabled until user action');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
