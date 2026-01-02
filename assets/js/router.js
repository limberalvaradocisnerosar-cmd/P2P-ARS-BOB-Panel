import { loadHTML, waitForElement, emitViewReady } from './view-loader.js';
const ROUTES = {
  '/': 'converter',
  '/references': 'references',
  '/status': 'status',
  '/settings': 'settings'
};
let APP_CONTAINER = null;
let SETTINGS_CONTAINER = null;
let currentView = null;
function getViewFromHash() {
  const hash = window.location.hash.slice(1) || '/';
  return ROUTES[hash] || 'converter';
}
export function navigateTo(route) {
  if (!ROUTES[route]) {
    console.warn(`[Router] Ruta desconocida: ${route}`);
    return;
  }
  window.location.hash = route;
}
async function loadMainView() {
  if (!APP_CONTAINER) {
    APP_CONTAINER = document.getElementById('app-view-container');
    if (!APP_CONTAINER) {
      console.error('[Router] app-view-container not found');
      return;
    }
  }
  APP_CONTAINER.innerHTML = '';
  if (APP_CONTAINER.children.length > 0) {
    while (APP_CONTAINER.firstChild) {
      APP_CONTAINER.removeChild(APP_CONTAINER.firstChild);
    }
  }
  const converterLoaded = await loadHTML('assets/htmls/conversion-p2p.html', APP_CONTAINER);
  if (converterLoaded) {
    await new Promise(resolve => setTimeout(resolve, 50));
    const panels = APP_CONTAINER.querySelectorAll('#conversion-panel, .app-card-converter');
    if (panels.length > 1) {
      for (let i = 1; i < panels.length; i++) {
        panels[i].remove();
      }
    }
    const panelAfterWait = APP_CONTAINER.querySelector('#conversion-panel');
    const amountEl = panelAfterWait ? panelAfterWait.querySelector('#amount') : null;
    const refreshBtn = panelAfterWait ? panelAfterWait.querySelector('#refresh-btn') : null;
    const amountElFallback = amountEl || document.getElementById('amount');
    const refreshBtnFallback = refreshBtn || document.getElementById('refresh-btn');
    const panelFallback = panelAfterWait || document.getElementById('conversion-panel');
    if (amountElFallback && refreshBtnFallback && panelFallback) {
      const existingReferences = APP_CONTAINER.querySelector('#reference-prices-panel');
      if (!existingReferences) {
        await loadHTML('assets/htmls/preciosdereferencia.html', APP_CONTAINER, true);
      }
      const referencePanels = APP_CONTAINER.querySelectorAll('#reference-prices-panel');
      if (referencePanels.length > 1) {
        for (let i = 1; i < referencePanels.length; i++) {
          referencePanels[i].remove();
        }
      }
      emitViewReady('converter');
      window.dispatchEvent(new CustomEvent('view-loaded', { 
        detail: { view: 'converter' } 
      }));
    } else {
      console.error('[Router] Critical elements not found in converter panel', {
        amount: !!amountElFallback,
        refresh: !!refreshBtnFallback,
        panel: !!panelFallback,
        containerHTML: APP_CONTAINER.innerHTML.substring(0, 200)
      });
    }
  } else {
    console.error('[Router] Failed to load converter.html');
  }
}
async function loadReferencesView() {
  if (!APP_CONTAINER) {
    APP_CONTAINER = document.getElementById('app-view-container');
  }
  if (APP_CONTAINER) {
    APP_CONTAINER.innerHTML = '';
    await loadHTML('assets/htmls/preciosdereferencia.html', APP_CONTAINER);
    await waitForElement('#reference-prices-panel');
    emitViewReady('references');
  }
}
async function loadStatusView() {
  if (!APP_CONTAINER) {
    APP_CONTAINER = document.getElementById('app-view-container');
  }
  if (APP_CONTAINER) {
    APP_CONTAINER.innerHTML = '';
    console.warn('[Router] Status view no disponible');
  }
}
export async function loadSettingsView() {
  if (!SETTINGS_CONTAINER) {
    SETTINGS_CONTAINER = document.getElementById('settings-content');
  }
  if (SETTINGS_CONTAINER) {
    const loaded = await loadHTML('assets/htmls/panelconfi.html', SETTINGS_CONTAINER);
    if (loaded) {
      await waitForElement('#settings-close', 3000);
      await waitForElement('#theme-dark', 2000);
      emitViewReady('settings');
      window.dispatchEvent(new CustomEvent('settings-view-ready'));
      return true;
    } else {
      console.error('[Router] Failed to load settings.html');
      return false;
    }
  } else {
    console.error('[Router] SETTINGS_CONTAINER not found');
    return false;
  }
}
async function route() {
  const viewName = getViewFromHash();
  if (viewName === currentView) {
    return;
  }
  currentView = viewName;
  switch (viewName) {
    case 'converter':
      await loadMainView();
      break;
    case 'references':
      await loadReferencesView();
      break;
    case 'status':
      await loadStatusView();
      break;
    case 'settings':
      break;
    default:
      await loadMainView();
  }
}
export function initRouter() {
  const viewContainer = document.getElementById('app-view-container');
  if (viewContainer) {
    window.dispatchEvent(new CustomEvent('view-ready', { 
      detail: { view: 'header' } 
    }));
    route();
  } else {
    console.error('[Router] app-view-container not found');
  }
  window.addEventListener('hashchange', route);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRouter);
} else {
  initRouter();
}