let isSettingsOpen = false;
function connectSettingsTrigger() {
  const trigger = document.getElementById('settings-trigger');
  if (trigger && !trigger.dataset.listenerAttached) {
    trigger.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await openSettingsPanel();
    });
    trigger.dataset.listenerAttached = 'true';
    return true;
  }
  return false;
}
function initSettingsPanel() {
  connectSettingsTrigger();
  const panel = document.getElementById('settings-panel');
  if (!panel) {
    setTimeout(connectSettingsTrigger, 100);
    return;
  }
  if (!window.settingsEscListenerAdded) {
    window.settingsEscListenerAdded = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        closeSettingsPanel();
      }
    });
  }
  window.addEventListener('settings-view-ready', () => {
    setupCollapsableSections();
  });
  window.addEventListener('view-ready', (e) => {
    if (e.detail?.view === 'header' || document.getElementById('settings-trigger')) {
      connectSettingsTrigger();
    }
  });
  loadTheme();
  renderSettingsState();
}
async function openSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const trigger = document.getElementById('settings-trigger');
  if (!panel || !trigger) {
    return;
  }
  panel.classList.add('open');
  trigger.setAttribute('aria-expanded', 'true');
  isSettingsOpen = true;
  document.body.style.overflow = 'hidden';
  const settingsContent = document.getElementById('settings-content');
  if (settingsContent) {
    const content = settingsContent.innerHTML.trim();
    const hasRealContent = content.length > 200 && content.includes('settings-close');
    if (!hasRealContent) {
      import('./router.js').then(({ loadSettingsView }) => {
        loadSettingsView().then(() => {
          reconnectSettingsListeners();
          updateSettingsPanelState();
        });
      });
    } else {
      reconnectSettingsListeners();
      updateSettingsPanelState();
    }
  }
}
function updateSettingsPanelState() {
  import('./ui-state.js').then((module) => {
    if (module.refreshPricesUsed) {
      const pricesContent = document.getElementById('prices-accordion-content');
      if (pricesContent && pricesContent.style.display !== 'none') {
        module.refreshPricesUsed();
      }
    }
    if (module.renderSystemStatus) {
      const systemContent = document.getElementById('system-accordion-content');
      if (systemContent && systemContent.style.display !== 'none') {
        module.renderSystemStatus();
      }
    }
  }).catch(err => {
    const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (IS_DEV) {
      console.warn('[Settings] Error updating panel state:', err);
    }
  });
}
function reconnectSettingsListeners() {
  const closeBtn = document.getElementById('settings-close');
  const overlay = document.getElementById('settings-overlay');
  if (closeBtn) {
    closeBtn.removeEventListener('click', handleCloseClick);
    closeBtn.addEventListener('click', handleCloseClick);
  }
  if (overlay) {
    overlay.removeEventListener('click', handleOverlayClick);
    overlay.addEventListener('click', handleOverlayClick);
  }
  setupCollapsableSections();
  window.dispatchEvent(new CustomEvent('settings-view-ready'));
}
function handleCloseClick(e) {
  e.preventDefault();
  e.stopPropagation();
  closeSettingsPanel();
}
function handleOverlayClick(e) {
  e.preventDefault();
  e.stopPropagation();
  closeSettingsPanel();
}
function setupCollapsableSections() {
  if (window.accordionsConfigured) {
    return;
  }
  const collapsableSections = [
    { headerId: 'prices-accordion-header', contentId: 'prices-accordion-content' },
    { headerId: 'system-accordion-header', contentId: 'system-accordion-content' }
  ];
  function closeAllSections(exceptHeaderId) {
    collapsableSections.forEach(({ headerId, contentId }) => {
      if (headerId !== exceptHeaderId) {
        const header = document.getElementById(headerId);
        const content = document.getElementById(contentId);
        if (header && content) {
          header.setAttribute('aria-expanded', 'false');
          content.style.display = 'none';
        }
      }
    });
  }
  collapsableSections.forEach(({ headerId, contentId }) => {
    const header = document.getElementById(headerId);
    const content = document.getElementById(contentId);
    if (header && content && !header.dataset.accordionConfigured) {
      header.setAttribute('aria-expanded', 'false');
      content.style.display = 'none';
      header.addEventListener('click', () => {
        const isExpanded = header.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
          header.setAttribute('aria-expanded', 'false');
          content.style.display = 'none';
        } else {
          closeAllSections(headerId);
          header.setAttribute('aria-expanded', 'true');
          content.style.display = 'block';
          requestAnimationFrame(() => {
            if (headerId === 'prices-accordion-header') {
              import('./ui-state.js').then((module) => {
                if (module.refreshPricesUsed) {
                  module.refreshPricesUsed();
                }
              }).catch(err => {
                const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                if (IS_DEV) {
                  console.warn('[Settings] Error loading ui-state:', err);
                }
              });
            } else if (headerId === 'system-accordion-header') {
              import('./ui-state.js').then((module) => {
                if (module.renderSystemStatus) {
                  module.renderSystemStatus();
                }
              }).catch(err => {
                const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                if (IS_DEV) {
                  console.warn('[Settings] Error loading ui-state:', err);
                }
              });
            }
          });
        }
      });
      header.dataset.accordionConfigured = 'true';
    }
  });
  window.accordionsConfigured = true;
}
function closeSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const trigger = document.getElementById('settings-trigger');
  if (!panel) {
    const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (IS_DEV) {
      console.error('[Settings] Panel no encontrado al cerrar');
    }
    return;
  }
  panel.classList.remove('open');
  if (trigger) {
    trigger.setAttribute('aria-expanded', 'false');
  }
  isSettingsOpen = false;
  document.body.style.overflow = '';
}
async function toggleTheme() {
  const { toggleTheme: toggleThemeFromModule } = await import('./theme.js');
  toggleThemeFromModule();
}
function loadTheme() {
  const savedTheme = localStorage.getItem('p2p-theme') || 'light';
  const html = document.documentElement;
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleLabel(savedTheme);
}
function updateThemeToggleLabel(theme) {
  const label = document.querySelector('.theme-toggle-label');
  if (label) {
    label.textContent = theme === 'dark' ? 'Oscuro' : 'Claro';
  }
}
let settingsState = {
  cacheTTL: 0,
  lastUpdate: null,
  cooldownRemaining: 0,
  pricesTimestamp: null
};
export function updateCacheStatus(secondsRemaining, lastUpdate) {
  settingsState.cacheTTL = secondsRemaining;
  settingsState.lastUpdate = lastUpdate;
  renderSettingsState();
}
export function updateCooldownStatus(secondsRemaining) {
  settingsState.cooldownRemaining = secondsRemaining;
  renderSettingsState();
}
export function updatePricesTimestamp(timestamp) {
  settingsState.pricesTimestamp = timestamp;
  renderSettingsState();
}
function renderSettingsState() {
  const cacheStatusText = document.getElementById('cache-status-text');
  const cacheTime = document.getElementById('cache-time');
  if (cacheStatusText && cacheTime) {
    if (settingsState.cacheTTL > 0) {
      cacheStatusText.textContent = 'Activo';
      cacheTime.textContent = `${settingsState.cacheTTL}s restantes`;
    } else {
      cacheStatusText.textContent = 'No disponible';
      cacheTime.textContent = '—';
    }
  }
  const lastUpdateEl = document.getElementById('last-update');
  if (lastUpdateEl) {
    if (settingsState.lastUpdate) {
      const date = new Date(settingsState.lastUpdate);
      lastUpdateEl.textContent = date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      lastUpdateEl.textContent = '—';
    }
  }
  const cooldownTime = document.getElementById('cooldown-time');
  if (cooldownTime) {
    if (settingsState.cooldownRemaining > 0) {
      cooldownTime.textContent = `${settingsState.cooldownRemaining}s`;
    } else {
      cooldownTime.textContent = 'Disponible';
    }
  }
  if (settingsState.pricesTimestamp) {
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettingsPanel);
} else {
  initSettingsPanel();
}