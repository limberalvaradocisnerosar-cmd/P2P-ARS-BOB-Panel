import { CONFIG } from './config.js';
import { fetchPrices, enableFetchForUserAction, disableFetchAfterOperation, isFetchAllowedCheck } from './api.js';
import { median, arsToBob, bobToArs, formatNumber, filterAds, removeOutliers } from './calc.js';
import { getCache, setCache, clearCache } from './cache.js';
import { setResult, setLoading, setError, getAmount, getDirection, setupInputListeners, setRefreshButtonLoading, setRefreshButtonSuccess, renderInfoCard, renderReferencePrices, renderReferenceTable, setupReferencePricesToggle, startRefreshCountdown, setupSwapButton, updateResultPrices, hideReferenceTable, resetReferenceTableUIState, showSuccessToast, updateCacheStatusBadge, startCacheBadgeUpdates, stopCacheBadgeUpdates } from './ui.js';
import { updateCacheState, updateCooldownState, updatePricesTimestamp, refreshPricesUsed } from './ui-state.js';
import { log, warn, error } from './logger.js';
let pricesState = {
  ars: { buy: null, sell: null },
  bob: { buy: null, sell: null },
  timestamp: null
};
export function getPricesState() {
  return {
    ars: { buy: pricesState.ars.buy, sell: pricesState.ars.sell },
    bob: { buy: pricesState.bob.buy, sell: pricesState.bob.sell },
    timestamp: pricesState.timestamp
  };
}
if (typeof window !== 'undefined') {
  window.getPricesState = getPricesState;
}
let referencePricesState = {
  ars_buy: [],
  ars_sell: [],
  bob_buy: [],
  bob_sell: [],
  timestamp: null
};
let isRefreshing = false;
let isCooldown = false;
let lastFetchTimestamp = 0;
const MIN_FETCH_INTERVAL = 60000;
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
  log('[SECURITY] PricesState cleared');
}
function updatePricesState(arsBuy, arsSell, bobBuy, bobSell) {
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
  log('[STATE] PricesState updated', pricesState);
}
function loadPricesStateFromCache() {
  const arsBuy = getCache('ARS_BUY');
  const arsSell = getCache('ARS_SELL');
  const bobBuy = getCache('BOB_BUY');
  const bobSell = getCache('BOB_SELL');
  if (arsBuy !== null && arsSell !== null && bobBuy !== null && bobSell !== null) {
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
      log('[CACHE] PricesState loaded from cache', pricesState);
      const cacheData = getCache('ARS_BUY');
      if (cacheData && pricesState.timestamp) {
        const cacheAge = Date.now() - pricesState.timestamp.getTime();
        const cacheTTL = CONFIG.CACHE_TTL;
        const remaining = Math.max(0, Math.floor((cacheTTL - cacheAge) / 1000));
        updateCacheState(remaining, pricesState.timestamp);
        updatePricesTimestamp(pricesState.timestamp.getTime());
        updateCacheStatusBadge(remaining, pricesState.timestamp);
        startCacheBadgeUpdates();
      } else {
        updateCacheStatusBadge(null, null);
      }
      window.currentReferencePrices = null;
      return true;
    } else {
      warn('[SECURITY] Invalid cached data detected, clearing cache');
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
  const direction = getDirection();
  if (direction === 'ARS_BOB') {
    updateResultPrices(pricesState.ars.buy, pricesState.bob.sell, direction);
  } else {
    updateResultPrices(pricesState.bob.buy, pricesState.ars.sell, direction);
  }
  renderInfoCard(priceDataForUI);
  renderReferencePrices(priceDataForUI, pricesState.timestamp);
  if (window.currentReferencePrices) {
    renderReferenceTable(window.currentReferencePrices);
  }
  log('[UI] All UI rendered from pricesState');
}
async function fetchAndProcessPrice(fiat, tradeType) {
  log(`[FETCH] Fetching prices for ${fiat} ${tradeType}`);
  const ads = await fetchPrices({ fiat, tradeType });
  if (!ads || !Array.isArray(ads) || ads.length === 0) {
    throw new Error(`No ads returned for ${fiat} ${tradeType}`);
  }
  const filteredAds = filterAds(ads, CONFIG.MIN_MONTH_ORDERS, CONFIG.MIN_FINISH_RATE);
  let prices;
  if (filteredAds.length === 0) {
    warn(`[SECURITY] No ads passed filter for ${fiat} ${tradeType}, using all ads`);
    prices = ads.map(ad => ad.price).filter(p => typeof p === 'number' && isFinite(p) && p > 0);
  } else {
    prices = filteredAds.map(ad => ad.price).filter(p => typeof p === 'number' && isFinite(p) && p > 0);
  }
  if (prices.length === 0) {
    throw new Error(`No valid prices found for ${fiat} ${tradeType}`);
  }
  const pricesWithoutOutliers = removeOutliers(prices);
  const finalPrices = pricesWithoutOutliers.length > 0 ? pricesWithoutOutliers : prices;
  const limitedPrices = finalPrices.slice(0, 5);
  if (limitedPrices.length === 0) {
    throw new Error(`No prices remaining after processing for ${fiat} ${tradeType}`);
  }
  const medianPrice = median(limitedPrices);
  if (typeof medianPrice !== 'number' || !isFinite(medianPrice) || medianPrice <= 0) {
    throw new Error(`Invalid median price calculated for ${fiat} ${tradeType}`);
  }
  const timestamp = Date.now();
  const referencePrices = limitedPrices.map(price => ({
    price: price,
    timestamp: timestamp
  }));
  log(`[FETCH] Prices processed for ${fiat} ${tradeType}:`, medianPrice, `(${limitedPrices.length} prices)`);
  return { medianPrice, referencePrices };
}
async function fetchAllPricesFromAPI() {
  if (!isFetchAllowedCheck()) {
    throw new Error('Fetch not allowed - security guard');
  }
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTimestamp;
  if (lastFetchTimestamp > 0 && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
    const remaining = Math.ceil((MIN_FETCH_INTERVAL - timeSinceLastFetch) / 1000);
    throw new Error(`Rate limit: Please wait ${remaining} seconds before refreshing again`);
  }
  log('[FETCH] Fetching all prices from Binance P2P');
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
    log('[CACHE] Cache updated with new snapshot');
    updatePricesState(arsBuy, arsSell, bobBuy, bobSell);
    referencePricesState.ars_buy = arsBuyData.referencePrices;
    referencePricesState.ars_sell = arsSellData.referencePrices;
    referencePricesState.bob_buy = bobBuyData.referencePrices;
    referencePricesState.bob_sell = bobSellData.referencePrices;
    referencePricesState.timestamp = new Date();
    log('[STATE] ReferencePricesState updated');
    window.currentReferencePrices = referencePricesState;
    lastFetchTimestamp = Date.now();
    const now = Date.now();
    updatePricesTimestamp(now);
    const cacheTTLSeconds = Math.floor(CONFIG.CACHE_TTL / 1000);
    updateCacheState(cacheTTLSeconds, now);
    updateCacheStatusBadge(cacheTTLSeconds, new Date(now));
    startCacheBadgeUpdates();
    return { arsBuy, arsSell, bobBuy, bobSell };
  } catch (err) {
    error('[FETCH] Error in fetchAllPricesFromAPI:', err);
    throw err;
  }
}
async function loadPrices(forceRefresh = false) {
  if (forceRefresh) {
    warn('[SECURITY] loadPrices called with forceRefresh=true - this should not happen');
    return;
  }
    const loadedFromCache = loadPricesStateFromCache();
    if (loadedFromCache) {
      log('[CACHE] Loaded prices from cache');
      renderAllUI();
      refreshPricesUsed();
      const direction = getDirection();
      if (pricesState.timestamp) {
        const cacheAge = Date.now() - pricesState.timestamp.getTime();
        const cacheTTL = CONFIG.CACHE_TTL;
        const remaining = Math.max(0, Math.floor((cacheTTL - cacheAge) / 1000));
        updateCacheStatusBadge(remaining, pricesState.timestamp);
        if (remaining > 0) {
          startCacheBadgeUpdates();
        }
      } else {
        updateCacheStatusBadge(null, null);
      }
    } else {
      updateCacheStatusBadge(null, null);
      log('[CACHE] Cache empty or expired - waiting for manual refresh');
      setError(null, 'NO_DATA');
      hideReferenceTable();
      refreshPricesUsed();
    }
}
async function calculateConversion() {
  const amount = getAmount();
  const direction = getDirection();
  if (typeof amount !== 'number' || !isFinite(amount) || isNaN(amount) || amount <= 0) {
    setResult('—');
    return;
  }
  if (amount > 1000000000000) {
    setError(null, 'INVALID_DATA');
    return;
  }
  if (amount === 0) {
    setResult('—');
    return;
  }
  const arsBuy = pricesState.ars?.buy;
  const arsSell = pricesState.ars?.sell;
  const bobBuy = pricesState.bob?.buy;
  const bobSell = pricesState.bob?.sell;
  if (!arsBuy || !arsSell || !bobBuy || !bobSell ||
      typeof arsBuy !== 'number' || !isFinite(arsBuy) || isNaN(arsBuy) ||
      typeof arsSell !== 'number' || !isFinite(arsSell) || isNaN(arsSell) ||
      typeof bobBuy !== 'number' || !isFinite(bobBuy) || isNaN(bobBuy) ||
      typeof bobSell !== 'number' || !isFinite(bobSell) || isNaN(bobSell)) {
    setError(null, 'NO_DATA');
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
    if (typeof result !== 'number' || !isFinite(result) || isNaN(result) || result <= 0) {
      throw new Error('Invalid calculation result');
    }
    const formatted = formatNumber(result, 2);
    setResult(`${formatted} ${currency}`);
    if (direction === 'ARS_BOB') {
      updateResultPrices(pricesState.ars.buy, pricesState.bob.sell, direction);
    } else {
      updateResultPrices(pricesState.bob.buy, pricesState.ars.sell, direction);
    }
  } catch (err) {
    error('[CALC] Error calculating conversion:', err);
    setError(null, 'INVALID_DATA');
  } finally {
    setLoading(false);
  }
}
export async function refreshPrices() {
  log('[SECURITY] Refresh clicked by user');
  if (isRefreshing) {
    warn('[SECURITY] Refresh already in progress, ignoring click');
    return;
  }
  if (isCooldown) {
    warn('[SECURITY] Cooldown active, ignoring click');
    return;
  }
  enableFetchForUserAction();
  isRefreshing = true;
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.cursor = 'not-allowed';
  }
  setRefreshButtonLoading(true, null);
  try {
    hideReferenceTable();
    resetReferenceTableUIState();
    clearCache();
    clearPricesState();
    window.currentReferencePrices = null;
    updateCacheState(0, null);
    updatePricesTimestamp(null);
    refreshPricesUsed();
    log('[FETCH] Fetching prices from Binance P2P');
    await fetchAllPricesFromAPI();
    log('[FETCH] Prices updated successfully');
    setRefreshButtonSuccess();
    showSuccessToast('¡Ya puedes convertir!');
    renderAllUI();
    refreshPricesUsed();
    const direction = getDirection();
    if (window.currentReferencePrices) {
      renderReferenceTable(window.currentReferencePrices);
    }
    const amount = getAmount();
    if (amount > 0 && typeof amount === 'number' && isFinite(amount)) {
      await calculateConversion();
    } else {
      setResult('—');
    }
    const countdownSeconds = Math.floor(CONFIG.CACHE_TTL / 1000);
    isCooldown = true;
    let cooldownRemaining = countdownSeconds;
    const cooldownInterval = setInterval(() => {
      cooldownRemaining--;
      updateCooldownState(cooldownRemaining);
      if (cooldownRemaining <= 0) {
        clearInterval(cooldownInterval);
      }
    }, 1000);
    setTimeout(() => {
      hideReferenceTable();
      log('[UI] Tabla y precio de referencia ocultados después de 60 segundos');
    }, countdownSeconds * 1000);
    startRefreshCountdown(countdownSeconds, () => {
      log('[SECURITY] Cooldown completed, button unlocked');
      isCooldown = false;
      updateCooldownState(0);
      clearInterval(cooldownInterval);
    });
  } catch (err) {
    error('[FETCH] Error refreshing prices:', err);
    const errorMessage = err.message || '';
    if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      setError(null, 'RATE_LIMIT');
    } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      setError(null, 'NETWORK_ERROR');
    } else if (errorMessage.includes('Invalid') || errorMessage.includes('parse')) {
      setError(null, 'INVALID_DATA');
    } else {
      setError(null, 'FETCH_ERROR');
    }
    isCooldown = false;
    const cached = loadPricesStateFromCache();
    if (cached) {
      renderAllUI();
      log('[CACHE] Restored prices from cache after error');
    }
  } finally {
    disableFetchAfterOperation();
    isRefreshing = false;
    if (!isCooldown) {
      setRefreshButtonLoading(false);
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.style.cursor = 'pointer';
      }
    }
  }
}
async function init() {
  log('[INIT] Initializing P2P Panel');
  disableFetchAfterOperation();
  function waitForView() {
    return new Promise((resolve) => {
      if (document.getElementById('amount') && document.getElementById('refresh-btn')) {
        resolve();
      } else {
        window.addEventListener('view-ready', (e) => {
          if (e.detail?.view === 'converter') {
            resolve();
          }
        }, { once: true });
        setTimeout(() => {
          if (document.getElementById('amount') && document.getElementById('refresh-btn')) {
            resolve();
          }
        }, 3000);
      }
    });
  }
  await waitForView();
  setupInputListeners(calculateConversion);
  setupReferencePricesToggle();
  setupSwapButton();
  const directionSelect = document.getElementById('direction');
  if (directionSelect) {
    directionSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    if (!refreshBtn.dataset.listenerAttached) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        refreshPrices();
      });
      refreshBtn.dataset.listenerAttached = 'true';
    }
  } else {
    setTimeout(() => {
      const retryBtn = document.getElementById('refresh-btn');
      if (retryBtn && !retryBtn.dataset.listenerAttached) {
        retryBtn.addEventListener('click', (e) => {
          e.preventDefault();
          refreshPrices();
        });
        retryBtn.dataset.listenerAttached = 'true';
      }
    }, 200);
  }
  await loadPrices(false);
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
  log('[INIT] Initialization complete - fetch disabled until user action');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
window.refreshPrices = refreshPrices;