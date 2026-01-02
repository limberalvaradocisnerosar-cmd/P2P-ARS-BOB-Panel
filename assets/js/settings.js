/**
 * Settings Panel & Theme Toggle
 * Maneja el panel lateral de configuración y el cambio de tema
 */

// Estado del panel
let isSettingsOpen = false;

// Inicializar panel de configuración
function initSettingsPanel() {
  const trigger = document.getElementById('settings-trigger');
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const close = document.getElementById('settings-close');
  const themeToggle = document.getElementById('theme-toggle');

  if (!trigger || !panel || !overlay || !close) return;

  // Abrir panel
  trigger.addEventListener('click', () => {
    openSettingsPanel();
  });

  // Cerrar panel
  close.addEventListener('click', () => {
    closeSettingsPanel();
  });

  overlay.addEventListener('click', () => {
    closeSettingsPanel();
  });

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSettingsOpen) {
      closeSettingsPanel();
    }
  });

  // Toggle de tema
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      toggleTheme();
    });
  }

  // Cargar tema guardado
  loadTheme();
}

// Abrir panel
function openSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const trigger = document.getElementById('settings-trigger');
  
  if (!panel || !trigger) return;

  panel.classList.add('settings-panel-open');
  trigger.setAttribute('aria-expanded', 'true');
  isSettingsOpen = true;
  document.body.style.overflow = 'hidden';
}

// Cerrar panel
function closeSettingsPanel() {
  const panel = document.getElementById('settings-panel');
  const trigger = document.getElementById('settings-trigger');
  
  if (!panel || !trigger) return;

  panel.classList.remove('settings-panel-open');
  trigger.setAttribute('aria-expanded', 'false');
  isSettingsOpen = false;
  document.body.style.overflow = '';
}

// Toggle de tema
function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('p2p-theme', newTheme);
  
  updateThemeToggleLabel(newTheme);
}

// Cargar tema guardado
function loadTheme() {
  const savedTheme = localStorage.getItem('p2p-theme') || 'dark';
  const html = document.documentElement;
  
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleLabel(savedTheme);
}

// Actualizar label del toggle
function updateThemeToggleLabel(theme) {
  const label = document.querySelector('.theme-toggle-label');
  if (label) {
    label.textContent = theme === 'dark' ? 'Oscuro' : 'Claro';
  }
}

// Actualizar estado de cache (llamado desde main.js)
export function updateCacheStatus(secondsRemaining, lastUpdate) {
  const cacheStatus = document.getElementById('cache-status');
  const cacheTime = document.getElementById('cache-time');
  const lastUpdateEl = document.getElementById('last-update');
  
  if (cacheStatus && cacheTime) {
    if (secondsRemaining > 0) {
      cacheStatus.querySelector('.cache-status-text').textContent = 'Activo';
      cacheTime.textContent = `${secondsRemaining}s restantes`;
    } else {
      cacheStatus.querySelector('.cache-status-text').textContent = 'No disponible';
      cacheTime.textContent = '—';
    }
  }
  
  if (lastUpdateEl && lastUpdate) {
    const date = new Date(lastUpdate);
    lastUpdateEl.textContent = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
}

// Inicializar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettingsPanel);
} else {
  initSettingsPanel();
}

