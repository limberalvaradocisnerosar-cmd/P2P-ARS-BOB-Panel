import { CONFIG, COOLDOWN_MS, getCookie, setCookie, hasConsent, setConsent } from './config.js';
import { fetchPrices, enableFetchForUserAction, disableFetchAfterOperation, isFetchAllowedCheck } from './api.js';
import { median, arsToBob, bobToArs, formatNumber, filterAds, removeOutliers } from './calc.js';
import { getCache, setCache, clearCache } from './cache.js';
import { saveLastPrices, restoreLastPrices, saveInputs, restoreInputs, saveUIState, restoreUIState, saveReferencePrices, restoreReferencePrices, syncCooldownFromCookie } from './persistence.js';
import { setResult, setLoading, setError, getAmount, getDirection, setAmount, setDirection, setupInputListeners, setRefreshButtonLoading, setRefreshButtonSuccess, renderInfoCard, renderReferencePrices, renderReferenceTable, setupReferencePricesToggle, setupSwapButton, updateResultPrices, hideReferenceTable, showReferenceTable, resetReferenceTableUIState, showSuccessToast, updateCacheStatusBadge, startCacheBadgeUpdates, stopCacheBadgeUpdates, showConsentModal, startCooldownTimer, stopCooldownTimer, updateCountdownUI } from './ui.js';
import { updateCacheState, updateCooldownState, updatePricesTimestamp, refreshPricesUsed } from './ui-state.js';
import { log, warn, error } from './logger.js';

const appState = {
  prices: null,
  referencePrices: null,
  isFetching: false,
  cooldownRemaining: 0
};

if (typeof window !== 'undefined') {
  window.appState = appState;
}

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
let lastFetchTimestamp = 0;
const MIN_FETCH_INTERVAL = 60000;

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
  
  appState.prices = {
    ars: { buy: arsBuy, sell: arsSell },
    bob: { buy: bobBuy, sell: bobSell },
    timestamp: pricesState.timestamp
  };
  
  saveLastPrices(appState.prices);
  log('[STATE] PricesState updated and saved');
}

function renderAllUI() {
  if (!appState.prices) return;
  
  const priceDataForUI = {
    ARS: {
      BUY: { median: appState.prices.ars.buy, best: appState.prices.ars.buy },
      SELL: { median: appState.prices.ars.sell, best: appState.prices.ars.sell }
    },
    BOB: {
      BUY: { median: appState.prices.bob.buy, best: appState.prices.bob.buy },
      SELL: { median: appState.prices.bob.sell, best: appState.prices.bob.sell }
    }
  };
  
  const direction = getDirection();
  if (direction === 'ARS_BOB') {
    updateResultPrices(appState.prices.ars.buy, appState.prices.bob.sell, direction);
  } else {
    updateResultPrices(appState.prices.bob.buy, appState.prices.ars.sell, direction);
  }
  
  renderInfoCard(priceDataForUI);
  renderReferencePrices(priceDataForUI, appState.prices.timestamp);
  
  if (appState.referencePrices) {
    window.currentReferencePrices = appState.referencePrices;
    renderReferenceTable(appState.referencePrices);
  }
  
  log('[UI] All UI rendered from appState');
}

function restorePricesFromStorage() {
  const restored = restoreLastPrices();
  if (!restored) return false;
  
  pricesState.ars.buy = restored.ars.buy;
  pricesState.ars.sell = restored.ars.sell;
  pricesState.bob.buy = restored.bob.buy;
  pricesState.bob.sell = restored.bob.sell;
  pricesState.timestamp = restored.timestamp;
  
  appState.prices = restored;
  
  if (pricesState.timestamp) {
    const cacheAge = Date.now() - pricesState.timestamp.getTime();
    const cacheTTL = CONFIG.CACHE_TTL;
    const remaining = Math.max(0, Math.floor((cacheTTL - cacheAge) / 1000));
    updateCacheStatusBadge(remaining, pricesState.timestamp);
    updateCacheState(remaining, pricesState.timestamp);
    updatePricesTimestamp(pricesState.timestamp.getTime());
    if (remaining > 0) {
      startCacheBadgeUpdates();
    }
  }
  
  const restoredRef = restoreReferencePrices();
  if (restoredRef) {
    referencePricesState = restoredRef;
    appState.referencePrices = restoredRef;
    window.currentReferencePrices = restoredRef;
  }
  
  log('[PERSISTENCE] Prices restored from storage');
  return true;
}

function restoreInputsFromStorage() {
  const saved = restoreInputs();
  if (!saved) return;
  
  if (saved.amount) {
    setAmount(saved.amount);
  }
  if (saved.direction) {
    setDirection(saved.direction);
  }
  
  log('[PERSISTENCE] Inputs restored');
}

function restoreTableState() {
  const uiState = restoreUIState();
  if (uiState.referenceTableExpanded && appState.referencePrices) {
    showReferenceTable();
  }
  log('[PERSISTENCE] Table state restored');
}

function syncCooldown() {
  const remaining = syncCooldownFromCookie();
  appState.cooldownRemaining = remaining;
  
  if (remaining > 0) {
    log('[SECURITY] Cooldown active from cookie:', Math.ceil(remaining / 1000), 'seconds');
    startCooldownTimer(remaining);
  } else {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.classList.add('cursor-pointer');
      refreshBtn.classList.remove('cursor-not-allowed', 'success');
    }
  }
}

function syncUIFromState() {
  if (appState.prices) {
    renderAllUI();
  }
  
  const amount = getAmount();
  if (amount > 0 && typeof amount === 'number' && isFinite(amount) && appState.prices) {
    calculateConversion();
  } else {
    setResult('—');
  }
  
  refreshPricesUsed();
}

async function initApp() {
  log('[INIT] Initializing app with full persistence');
  
  restorePricesFromStorage();
  restoreInputsFromStorage();
  restoreTableState();
  syncCooldown();
  syncUIFromState();
  
  log('[INIT] App initialized - state restored');
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
    appState.referencePrices = referencePricesState;
    saveReferencePrices(referencePricesState);
    log('[STATE] ReferencePricesState updated and saved');
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
  if (!appState.prices) {
    setError(null, 'NO_DATA');
    return;
  }
  const arsBuy = appState.prices.ars.buy;
  const arsSell = appState.prices.ars.sell;
  const bobBuy = appState.prices.bob.buy;
  const bobSell = appState.prices.bob.sell;
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
      result = arsToBob(amount, arsBuy, bobSell);
      currency = 'BOB';
    } else if (direction === 'BOB_ARS') {
      result = bobToArs(amount, bobBuy, arsSell);
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
      updateResultPrices(arsBuy, bobSell, direction);
    } else {
      updateResultPrices(bobBuy, arsSell, direction);
    }
    
    saveInputs(amount, direction);
  } catch (err) {
    error('[CALC] Error calculating conversion:', err);
    setError(null, 'INVALID_DATA');
  } finally {
    setLoading(false);
  }
}

async function intentarActualizar() {
  if (appState.cooldownRemaining > 0 || appState.isFetching) {
    log('[SECURITY] Cooldown or fetch in progress, blocking');
    return;
  }
  
  appState.isFetching = true;
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('cursor-not-allowed');
    refreshBtn.classList.remove('cursor-pointer');
  }
  setRefreshButtonLoading(true, null);
  
  try {
    log('[FETCH] Fetching prices from Binance P2P');
    await fetchAllPricesFromAPI();
    log('[FETCH] Prices updated successfully');
    
    setCookie('p2p_last_fetch', Date.now().toString(), 86400);
    appState.cooldownRemaining = COOLDOWN_MS;
    startCooldownTimer(COOLDOWN_MS);
    
    setRefreshButtonSuccess();
    showSuccessToast('¡Ya puedes convertir!');
    renderAllUI();
    refreshPricesUsed();
    
    const direction = getDirection();
    if (appState.referencePrices) {
      renderReferenceTable(appState.referencePrices);
    }
    
    const amount = getAmount();
    if (amount > 0 && typeof amount === 'number' && isFinite(amount)) {
      await calculateConversion();
    } else {
      setResult('—');
    }
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
    
    const restored = restoreLastPrices();
    if (restored) {
      appState.prices = restored;
      renderAllUI();
      log('[CACHE] Restored prices from storage after error');
    }
  } finally {
    disableFetchAfterOperation();
    appState.isFetching = false;
    if (appState.cooldownRemaining <= 0) {
      setRefreshButtonLoading(false);
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.classList.add('cursor-pointer');
        refreshBtn.classList.remove('cursor-not-allowed');
      }
    }
  }
}

export async function refreshPrices() {
  log('[SECURITY] Refresh clicked by user');
  
  if (appState.cooldownRemaining > 0) {
    warn('[SECURITY] Cooldown active, ignoring click');
    return;
  }
  
  if (!hasConsent()) {
    window.pendingRefreshAction = intentarActualizar;
    showConsentModal();
    return;
  }
  
  await intentarActualizar();
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
  
  setupInputListeners(() => {
    calculateConversion();
    const amount = getAmount();
    const direction = getDirection();
    saveInputs(amount, direction);
  });
  
  setupReferencePricesToggle();
  setupSwapButton();
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    if (!refreshBtn.dataset.listenerAttached) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        refreshPrices();
      });
      refreshBtn.dataset.listenerAttached = 'true';
    }
  }
  
  await initApp();
  
  log('[INIT] Initialization complete');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

window.refreshPrices = refreshPrices;

