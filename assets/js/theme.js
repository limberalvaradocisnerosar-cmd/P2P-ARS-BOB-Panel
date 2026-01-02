const THEME_STORAGE_KEY = 'p2p-theme';
const DEFAULT_THEME = 'light';
let currentTheme = DEFAULT_THEME;
function applyTheme(theme) {
  const html = document.documentElement;
  const body = document.body;
  const originalHtmlTransition = html.style.transition;
  const originalBodyTransition = body.style.transition;
  html.style.transition = 'none';
  body.style.transition = 'none';
  html.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  void html.offsetHeight;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      html.style.transition = originalHtmlTransition;
      body.style.transition = originalBodyTransition;
    });
  });
  updateThemeLabel(theme);
  syncRadioButtons();
  updateThemeIndicator(theme);
}
function updateThemeIndicator(theme) {
  const indicatorValue = document.getElementById('theme-indicator-value');
  if (indicatorValue) {
    indicatorValue.textContent = theme === 'dark' ? 'Dark' : 'Light';
  }
}
function updateThemeLabel(theme) {
  const label = document.getElementById('theme-label');
  if (label) {
    label.textContent = theme === 'dark' ? 'Oscuro' : 'Claro';
  }
  const darkRadio = document.getElementById('theme-dark');
  const lightRadio = document.getElementById('theme-light');
  if (darkRadio && lightRadio) {
    if (theme === 'dark') {
      darkRadio.checked = true;
      lightRadio.checked = false;
    } else {
      darkRadio.checked = false;
      lightRadio.checked = true;
    }
  }
}
function loadSavedTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    applyTheme(DEFAULT_THEME);
  }
}
export function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}
export function getCurrentTheme() {
  return currentTheme;
}
function syncRadioButtons() {
  const darkRadio = document.getElementById('theme-dark');
  const lightRadio = document.getElementById('theme-light');
  if (darkRadio && lightRadio) {
    if (currentTheme === 'dark') {
      darkRadio.checked = true;
      lightRadio.checked = false;
    } else {
      darkRadio.checked = false;
      lightRadio.checked = true;
    }
  }
}
export function initTheme() {
  loadSavedTheme();
  syncRadioButtons();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncRadioButtons);
  } else {
    setTimeout(syncRadioButtons, 0);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="toggle-theme"]')) {
      toggleTheme();
    }
  });
  window.addEventListener('settings-view-ready', () => {
    updateThemeLabel(currentTheme);
    syncRadioButtons();
    updateThemeIndicator(currentTheme);
    const darkRadio = document.getElementById('theme-dark');
    const lightRadio = document.getElementById('theme-light');
    if (darkRadio && lightRadio) {
      darkRadio.addEventListener('change', () => {
        if (darkRadio.checked) {
          applyTheme('dark');
        }
      });
      lightRadio.addEventListener('change', () => {
        if (lightRadio.checked) {
          applyTheme('light');
        }
      });
    }
  });
}
initTheme();