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
      cooldownTime.textContent = `${stateData.cooldownRemaining}s`;
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
  if (!date) return 'Never';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
function renderPricesUsed() {
  const pricesContent = document.getElementById('prices-used-content');
  if (!pricesContent) return;
  const pricesSection = document.getElementById('prices-accordion-content');
  if (pricesSection && pricesSection.style.display === 'none') {
    return;
  }
  const prices = window.getPricesState ? window.getPricesState() : null;
  if (!prices || !prices.ars.buy || !prices.ars.sell || !prices.bob.buy || !prices.bob.sell) {
    pricesContent.innerHTML = '<div class="prices-empty-message">Prices not loaded yet</div>';
    return;
  }
  pricesContent.innerHTML = `
    <div class="prices-definition-item">
      <dt class="prices-definition-term">ARS BUY</dt>
      <dd class="prices-definition-desc">${formatNumber(prices.ars.buy)}</dd>
    </div>
    <div class="prices-definition-item">
      <dt class="prices-definition-term">ARS SELL</dt>
      <dd class="prices-definition-desc">${formatNumber(prices.ars.sell)}</dd>
    </div>
    <div class="prices-definition-item">
      <dt class="prices-definition-term">BOB BUY</dt>
      <dd class="prices-definition-desc">${formatNumber(prices.bob.buy)}</dd>
    </div>
    <div class="prices-definition-item">
      <dt class="prices-definition-term">BOB SELL</dt>
      <dd class="prices-definition-desc">${formatNumber(prices.bob.sell)}</dd>
    </div>
  `;
}
export function refreshPricesUsed() {
  renderPricesUsed();
}
function renderSystemStatusInternal() {
  const systemCacheStatusBadge = document.getElementById('system-cache-status-badge');
  const systemCacheStatus = document.getElementById('system-cache-status');
  if (systemCacheStatusBadge && systemCacheStatus) {
    if (stateData.cacheActive) {
      systemCacheStatus.textContent = 'ACTIVE';
      systemCacheStatusBadge.className = 'system-status-badge badge-success';
    } else {
      systemCacheStatus.textContent = 'EXPIRED';
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
      systemLastUpdate.textContent = 'Never';
    }
  }
  const systemCooldownStatus = document.getElementById('system-cooldown-status');
  if (systemCooldownStatus) {
    const cooldownActive = stateData.cooldownRemaining > 0;
    systemCooldownStatus.textContent = cooldownActive ? 'YES' : 'NO';
  }
}
export function renderSystemStatus() {
  renderSystemStatusInternal();
}
function formatRelativeTime(date) {
  if (!date) return 'Never';
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  } else if (diffSec < 3600) {
    const minutes = Math.floor(diffSec / 60);
    return `${minutes}min ago`;
  } else if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  } else {
    return formatFullDate(date);
  }
}
function renderSettingsPanelLazy() {
  try {
    const pricesContent = document.getElementById('prices-accordion-content');
    const systemContent = document.getElementById('system-accordion-content');
    if (pricesContent && pricesContent.style.display !== 'none') {
      renderPricesUsed();
    }
    if (systemContent && systemContent.style.display !== 'none') {
      renderSystemStatusInternal();
    }
  } catch (error) {
    console.warn('[UI-State] Error en renderSettingsPanelLazy:', error);
  }
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
      console.warn('[UI-State] renderSettingsPanelLazy no está definida');
    }
  }
}
export function initUIState() {
  window.addEventListener('status-view-ready', () => {
    renderState();
  });
  window.addEventListener('settings-view-ready', () => {
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel?.classList.contains('open')) {
      renderState();
    }
  });
}
initUIState();