import { warn } from './logger.js';

let stateData = {
  cacheTTL: 0,
  cacheActive: false,
  lastUpdate: null,
  cooldownRemaining: 0,
  pricesTimestamp: null
};
export function updateCacheState(secondsRemaining, lastUpdate) {
  stateData.cacheTTL = secondsRemaining;
  stateData.cacheActive = secondsRemaining > 0;
  stateData.lastUpdate = lastUpdate ? new Date(lastUpdate) : null;
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel?.classList.contains('open')) {
    renderState();
  }
}
export function updateCooldownState(secondsRemaining) {
  stateData.cooldownRemaining = secondsRemaining;
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel?.classList.contains('open')) {
    renderState();
  }
}
export function updatePricesTimestamp(timestamp) {
  stateData.pricesTimestamp = timestamp ? new Date(timestamp) : null;
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel?.classList.contains('open')) {
    renderState();
  }
}
function formatTimestamp(date) {
  if (!date) return '—';
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
function renderStatusPanel() {
  const cacheText = document.getElementById('state-cache-text');
  const cacheTime = document.getElementById('state-cache-time');
  if (cacheText && cacheTime) {
    if (stateData.cacheActive) {
      cacheText.textContent = 'Activo';
      cacheTime.textContent = `${stateData.cacheTTL}s restantes`;
    } else {
      cacheText.textContent = 'No disponible';
      cacheTime.textContent = '—';
    }
  }
  const lastUpdate = document.getElementById('state-last-update');
  if (lastUpdate) {
    lastUpdate.textContent = formatTimestamp(stateData.lastUpdate);
  }
  const cooldownTime = document.getElementById('state-cooldown-time');
  if (cooldownTime) {
    if (stateData.cooldownRemaining > 0) {
      cooldownTime.textContent = 'Activo';
    } else {
      cooldownTime.textContent = 'Disponible';
    }
  }
  const timestamp = document.getElementById('state-timestamp');
  if (timestamp) {
    timestamp.textContent = formatTimestamp(stateData.pricesTimestamp);
  }
}
function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return '—';
  }
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
function formatFullDate(date) {
  if (!date) return 'Nunca';
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
function sanitizeNumeric(value) {
  if (typeof value !== 'number' || !isFinite(value) || isNaN(value)) {
    return null;
  }
  return value;
}

function createPriceItem(term, value) {
  const item = document.createElement('div');
  item.className = 'prices-definition-item';
  
  const dt = document.createElement('dt');
  dt.className = 'prices-definition-term';
  dt.textContent = term;
  
  const dd = document.createElement('dd');
  dd.className = 'prices-definition-desc';
  dd.textContent = formatNumber(value);
  
  item.appendChild(dt);
  item.appendChild(dd);
  return item;
}

function formatFullTimestamp(timestamp) {
  if (!timestamp) return '—';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function createCalculationItem(label, value) {
  const item = document.createElement('div');
  item.className = 'prices-definition-item';
  
  const dt = document.createElement('dt');
  dt.className = 'prices-definition-term';
  dt.textContent = label;
  
  const dd = document.createElement('dd');
  dd.className = 'prices-definition-desc';
  dd.textContent = value;
  
  item.appendChild(dt);
  item.appendChild(dd);
  return item;
}

function renderPricesUsed() {
  const pricesContent = document.getElementById('prices-used-content');
  if (!pricesContent) return;
  const prices = window.getPricesState ? window.getPricesState() : null;
  if (!prices || typeof prices !== 'object') {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'prices-empty-message';
    emptyMsg.textContent = 'Los precios aún no se han cargado';
    pricesContent.textContent = '';
    pricesContent.appendChild(emptyMsg);
    return;
  }
  const arsBuy = sanitizeNumeric(prices.ars?.buy);
  const arsSell = sanitizeNumeric(prices.ars?.sell);
  const bobBuy = sanitizeNumeric(prices.bob?.buy);
  const bobSell = sanitizeNumeric(prices.bob?.sell);
  const timestamp = prices.timestamp;
  if (!arsBuy || !arsSell || !bobBuy || !bobSell) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'prices-empty-message';
    emptyMsg.textContent = 'Los precios aún no se han cargado';
    pricesContent.textContent = '';
    pricesContent.appendChild(emptyMsg);
    return;
  }
  pricesContent.textContent = '';
  pricesContent.appendChild(createCalculationItem('Market', 'ARS / BOB'));
  pricesContent.appendChild(createCalculationItem('Side', 'BUY / SELL'));
  pricesContent.appendChild(createCalculationItem('Anuncios usados', '15'));
  pricesContent.appendChild(createCalculationItem('ARS BUY (promedio)', formatNumber(arsBuy, 2)));
  pricesContent.appendChild(createCalculationItem('ARS SELL (promedio)', formatNumber(arsSell, 2)));
  pricesContent.appendChild(createCalculationItem('BOB BUY (promedio)', formatNumber(bobBuy, 2)));
  pricesContent.appendChild(createCalculationItem('BOB SELL (promedio)', formatNumber(bobSell, 2)));
  pricesContent.appendChild(createCalculationItem('Timestamp', formatFullTimestamp(timestamp)));
}
export function refreshPricesUsed() {
  renderPricesUsed();
}
function renderSystemStatusInternal() {
  const systemCacheStatusBadge = document.getElementById('system-cache-status-badge');
  const systemCacheStatus = document.getElementById('system-cache-status');
  if (systemCacheStatusBadge && systemCacheStatus) {
    if (stateData.cacheActive) {
      systemCacheStatus.textContent = 'ACTIVO';
      systemCacheStatusBadge.className = 'system-status-badge badge-success';
    } else {
      systemCacheStatus.textContent = 'EXPIRADO';
      systemCacheStatusBadge.className = 'system-status-badge badge-inactive';
    }
  }
  const systemCacheTtl = document.getElementById('system-cache-ttl');
  if (systemCacheTtl) {
    if (stateData.cacheActive) {
      systemCacheTtl.textContent = `${stateData.cacheTTL}s`;
    } else {
      systemCacheTtl.textContent = '—';
    }
  }
  const systemLastUpdate = document.getElementById('system-last-update');
  if (systemLastUpdate) {
    if (stateData.lastUpdate) {
      systemLastUpdate.textContent = formatRelativeTime(stateData.lastUpdate);
    } else {
      systemLastUpdate.textContent = 'Nunca';
    }
  }
  const systemCooldownStatus = document.getElementById('system-cooldown-status');
  if (systemCooldownStatus) {
    const cooldownActive = stateData.cooldownRemaining > 0;
    systemCooldownStatus.textContent = cooldownActive ? 'SÍ' : 'NO';
  }
}
export function renderSystemStatus() {
  renderSystemStatusInternal();
}
function formatRelativeTime(date) {
  if (!date) return 'Nunca';
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return `hace ${diffSec}s`;
  } else if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `hace ${minutes}min`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `hace ${hours}h`;
  } else {
    return formatFullDate(date);
  }
}
function renderSettingsPanelLazy() {
}
function renderSettingsPanel() {
  renderSettingsPanelLazy();
}
function renderState() {
  if (document.getElementById('status-panel')) {
    renderStatusPanel();
  }
  const settingsPanel = document.getElementById('settings-panel');
  if (settingsPanel?.classList.contains('open')) {
    if (typeof renderSettingsPanelLazy === 'function') {
      renderSettingsPanelLazy();
    } else {
      warn('[UI-State] renderSettingsPanelLazy no está definida');
    }
  }
}
export function initUIState() {
  window.addEventListener('status-view-ready', () => {
    renderState();
  });
}
initUIState();