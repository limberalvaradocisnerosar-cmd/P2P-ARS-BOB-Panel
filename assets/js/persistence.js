
import { CONFIG, COOLDOWN_MS, getCookie, setCookie } from './config.js';
import { log } from './logger.js';

const STORAGE_KEYS = {
  LAST_PRICES: 'p2p_last_prices',
  INPUTS: 'p2p_inputs',
  UI_STATE: 'p2p_ui_state',
  REFERENCE_PRICES: 'p2p_reference_prices'
};

export function saveLastPrices(prices) {
  try {
    const data = {
      ars: prices.ars,
      bob: prices.bob,
      timestamp: prices.timestamp ? prices.timestamp.getTime() : null
    };
    localStorage.setItem(STORAGE_KEYS.LAST_PRICES, JSON.stringify(data));
    log('[PERSISTENCE] Saved last prices');
  } catch (e) {
    log('[PERSISTENCE] Failed to save prices:', e);
  }
}

export function restoreLastPrices() {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.LAST_PRICES);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    return {
      ars: data.ars,
      bob: data.bob,
      timestamp: data.timestamp ? new Date(data.timestamp) : null
    };
  } catch (e) {
    log('[PERSISTENCE] Failed to restore prices:', e);
    return null;
  }
}

export function saveInputs(amount, direction) {
  try {
    const data = {
      amount: amount || '',
      direction: direction || 'ARS_BOB',
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.INPUTS, JSON.stringify(data));
  } catch (e) {
    log('[PERSISTENCE] Failed to save inputs:', e);
  }
}

export function restoreInputs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.INPUTS);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    return {
      amount: data.amount || '',
      direction: data.direction || 'ARS_BOB'
    };
  } catch (e) {
    log('[PERSISTENCE] Failed to restore inputs:', e);
    return null;
  }
}

export function saveUIState(tableExpanded, referenceTableExpanded) {
  try {
    const data = {
      tableExpanded: tableExpanded || false,
      referenceTableExpanded: referenceTableExpanded || false,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(data));
  } catch (e) {
    log('[PERSISTENCE] Failed to save UI state:', e);
  }
}

export function restoreUIState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.UI_STATE);
    if (!saved) return { tableExpanded: false, referenceTableExpanded: false };
    
    const data = JSON.parse(saved);
    return {
      tableExpanded: data.tableExpanded || false,
      referenceTableExpanded: data.referenceTableExpanded || false
    };
  } catch (e) {
    log('[PERSISTENCE] Failed to restore UI state:', e);
    return { tableExpanded: false, referenceTableExpanded: false };
  }
}

export function saveReferencePrices(referencePrices) {
  try {
    const data = {
      ars_buy: referencePrices.ars_buy || [],
      ars_sell: referencePrices.ars_sell || [],
      bob_buy: referencePrices.bob_buy || [],
      bob_sell: referencePrices.bob_sell || [],
      timestamp: referencePrices.timestamp ? referencePrices.timestamp.getTime() : null
    };
    localStorage.setItem(STORAGE_KEYS.REFERENCE_PRICES, JSON.stringify(data));
  } catch (e) {
    log('[PERSISTENCE] Failed to save reference prices:', e);
  }
}

export function restoreReferencePrices() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.REFERENCE_PRICES);
    if (!saved) return null;
    
    const data = JSON.parse(saved);
    return {
      ars_buy: data.ars_buy || [],
      ars_sell: data.ars_sell || [],
      bob_buy: data.bob_buy || [],
      bob_sell: data.bob_sell || [],
      timestamp: data.timestamp ? new Date(data.timestamp) : null
    };
  } catch (e) {
    log('[PERSISTENCE] Failed to restore reference prices:', e);
    return null;
  }
}

export function syncCooldownFromCookie() {
  const lastFetch = getCookie('p2p_last_fetch');
  if (!lastFetch) return 0;
  
  const timestamp = Number(lastFetch);
  if (!timestamp || isNaN(timestamp)) return 0;
  
  const remaining = Math.max(COOLDOWN_MS - (Date.now() - timestamp), 0);
  return remaining;
}

