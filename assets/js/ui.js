import { formatNumber, calculateSpread, calculatePercentageDiff, median } from './calc.js';
function setPanelState(state) {
  const panel = document.getElementById('conversion-panel');
  if (panel) {
    panel.setAttribute('data-state', state);
  }
}
function setResultFieldState(state) {
  const resultField = document.querySelector('.converter-result-field');
  if (resultField) {
    resultField.setAttribute('data-state', state);
  }
}
export function setResult(value) {
  const resultElement = document.getElementById('result');
  const resultField = document.querySelector('.converter-result-field');
  if (!resultElement) {
    return;
  }
  resultElement.classList.remove('loading', 'error');
  if (value === '—' || value === '' || !value) {
    resultElement.textContent = '0,00';
    resultElement.setAttribute('data-empty', 'true');
    setResultFieldState('idle');
    setPanelState('idle');
  } else {
    resultElement.textContent = value;
    resultElement.removeAttribute('data-empty');
    setResultFieldState('success');
    setPanelState('success');
  }
}
export function setLoading(state) {
  const resultElement = document.getElementById('result');
  if (!resultElement) {
    return;
  }
  if (state) {
    resultElement.textContent = 'Calculando...';
    resultElement.classList.add('loading');
    resultElement.removeAttribute('data-empty');
    setResultFieldState('loading');
    setPanelState('loading');
  } else {
    resultElement.classList.remove('loading');
  }
}
export function setError(message) {
  const resultElement = document.getElementById('result');
  if (!resultElement) {
    return;
  }
  resultElement.textContent = message || 'Error al obtener precios';
  resultElement.classList.add('error');
  resultElement.removeAttribute('data-empty');
  setResultFieldState('error');
  setPanelState('error');
  setTimeout(() => {
    if (resultElement.classList.contains('error')) {
      setPanelState('idle');
      setResultFieldState('idle');
    }
  }, 3000);
}
export function getAmount() {
  const amountInput = document.getElementById('amount');
  if (!amountInput) {
    return 0;
  }
  const cleanValue = amountInput.dataset.numericValue;
  if (!cleanValue || cleanValue === '') {
    return 0;
  }
  const number = parseFloat(cleanValue);
  if (isNaN(number) || !isFinite(number) || number < 0) {
    return 0;
  }
  if (number > 1000000000000) {
    return 0;
  }
  return number;
}
export function getDirection() {
  const directionSelect = document.getElementById('direction');
  if (!directionSelect) {
    return 'ARS_BOB';
  }
  return directionSelect.value || 'ARS_BOB';
}
function formatMonetaryInput(value) {
  if (!value || value === '') {
    return '';
  }
  let cleaned = value.replace(/[^\d,]/g, '');
  const commaIndex = cleaned.indexOf(',');
  if (commaIndex !== -1) {
    const beforeComma = cleaned.substring(0, commaIndex).replace(/,/g, '');
    const afterComma = cleaned.substring(commaIndex + 1).replace(/,/g, '');
    cleaned = beforeComma + ',' + afterComma;
  }
  const parts = cleaned.split(',');
  let integerPart = parts[0] || '';
  const decimalPart = parts[1] || '';
  if (integerPart.length > 0) {
    if (integerPart.length > 1) {
      integerPart = integerPart.replace(/^0+/, '');
      if (integerPart === '') {
        if (decimalPart === '') {
          integerPart = '';
        } else {
          integerPart = '0';
        }
      }
    }
    else if (integerPart === '0' && decimalPart === '') {
      integerPart = '';
    }
  }
  if (integerPart && integerPart.length > 0) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  let formatted = integerPart;
  if (decimalPart !== '') {
    formatted += ',' + decimalPart;
  }
  return formatted;
}
function parseMonetaryInput(formattedValue) {
  if (!formattedValue || formattedValue === '') {
    return null;
  }
  let cleaned = formattedValue.replace(/\./g, '');
  cleaned = cleaned.replace(/,/g, '.');
  const number = parseFloat(cleaned);
  return isNaN(number) ? null : number;
}
function setCursorPosition(input, originalPosition, originalValue, newValue) {
  const beforeCursor = originalValue.substring(0, originalPosition);
  const nonNumericBefore = (beforeCursor.match(/[^\d]/g) || []).length;
  const digitsBefore = beforeCursor.replace(/[^\d]/g, '').length;
  let newPosition = 0;
  let digitsCounted = 0;
  for (let i = 0; i < newValue.length; i++) {
    if (/\d/.test(newValue[i])) {
      digitsCounted++;
      if (digitsCounted === digitsBefore) {
        newPosition = i + 1;
        break;
      }
    }
    newPosition = i + 1;
  }
  if (newPosition < newValue.length && /[^\d]/.test(newValue[newPosition])) {
    newPosition++;
  }
  setTimeout(() => {
    input.setSelectionRange(newPosition, newPosition);
  }, 0);
}
function updateCurrencyBadge() {
  const direction = getDirection();
  const badge = document.getElementById('input-currency-badge');
  if (badge) {
    badge.textContent = direction === 'ARS_BOB' ? 'ARS' : 'BOB';
  }
  const inputLabel = document.getElementById('input-currency-label');
  const outputLabel = document.getElementById('output-currency-label');
  if (inputLabel) {
    inputLabel.textContent = direction === 'ARS_BOB' ? 'ARS' : 'BOB';
  }
  if (outputLabel) {
    outputLabel.textContent = direction === 'ARS_BOB' ? 'BOB' : 'ARS';
  }
  const fromFlagImg = document.getElementById('from-flag-img');
  const toFlagImg = document.getElementById('to-flag-img');
  if (fromFlagImg) {
    fromFlagImg.src = direction === 'ARS_BOB' 
      ? 'assets/icons/argentina.svg' 
      : 'assets/icons/bolivia.svg';
    fromFlagImg.alt = direction === 'ARS_BOB' ? 'Argentina' : 'Bolivia';
  }
  if (toFlagImg) {
    toFlagImg.src = direction === 'ARS_BOB' 
      ? 'assets/icons/bolivia.svg' 
      : 'assets/icons/argentina.svg';
    toFlagImg.alt = direction === 'ARS_BOB' ? 'Bolivia' : 'Argentina';
  }
  const fromFlag = document.getElementById('from-flag');
  const toFlag = document.getElementById('to-flag');
  if (fromFlag) fromFlag.style.display = 'flex';
  if (toFlag) toFlag.style.display = 'flex';
}
export function updateResultPrices(priceFrom, priceTo, direction) {
}
export function setupSwapButton() {
  const swapButton = document.getElementById('swap-button');
  const directionSelect = document.getElementById('direction');
  if (!swapButton || !directionSelect) return;
  swapButton.addEventListener('click', () => {
    const swapIcon = swapButton.querySelector('.swap-icon');
    if (swapIcon) {
      swapIcon.classList.toggle('flipped');
    }
    const currentValue = directionSelect.value;
    directionSelect.value = currentValue === 'ARS_BOB' ? 'BOB_ARS' : 'ARS_BOB';
    directionSelect.dispatchEvent(new Event('change', { bubbles: true }));
    updateCurrencyBadge();
  });
}
export function setupInputListeners(callback) {
  const amountInput = document.getElementById('amount');
  const directionSelect = document.getElementById('direction');
  if (directionSelect) {
    directionSelect.addEventListener('change', () => {
      updateCurrencyBadge();
      callback();
    });
  }
  updateCurrencyBadge();
  if (amountInput) {
    amountInput.addEventListener('input', (e) => {
      const input = e.target;
      const originalValue = input.value;
      const originalPosition = input.selectionStart || 0;
      const formatted = formatMonetaryInput(originalValue);
      const numericValue = parseMonetaryInput(formatted);
      input.dataset.numericValue = numericValue !== null ? numericValue.toString() : '';
      if (formatted !== originalValue) {
        input.value = formatted;
        setCursorPosition(input, originalPosition, originalValue, formatted);
      }
      callback();
    });
    amountInput.addEventListener('blur', (e) => {
      const input = e.target;
      const value = input.value;
      if (value.includes(',')) {
        const parts = value.split(',');
        const integerPartRaw = parts[0] || '';
        let decimalPart = parts[1] || '';
        const integerPartClean = integerPartRaw.replace(/\./g, '');
        if (decimalPart.length === 0) {
          decimalPart = '00';
        } else if (decimalPart.length === 1) {
          decimalPart = decimalPart + '0';
        } else if (decimalPart.length > 2) {
          decimalPart = decimalPart.substring(0, 2);
        }
        const fullValue = integerPartClean + (decimalPart ? ',' + decimalPart : '');
        const numericValue = parseMonetaryInput(fullValue);
        if (numericValue !== null) {
          const formatted = formatMonetaryInput(fullValue);
          input.value = formatted;
          input.dataset.numericValue = numericValue.toString();
        }
      }
      callback();
    });
    amountInput.addEventListener('focus', (e) => {
    });
    amountInput.addEventListener('keydown', (e) => {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];
      if (allowedKeys.includes(e.key)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      if (!/[0-9.,]/.test(e.key)) {
        e.preventDefault();
      }
    });
    amountInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      const cleaned = pastedText.replace(/[^\d,]/g, '');
      const input = e.target;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value;
      const newValue = currentValue.substring(0, start) + cleaned + currentValue.substring(end);
      const formatted = formatMonetaryInput(newValue);
      const numericValue = parseMonetaryInput(formatted);
      input.value = formatted;
      input.dataset.numericValue = numericValue !== null ? numericValue.toString() : '';
      setTimeout(() => {
        input.setSelectionRange(formatted.length, formatted.length);
      }, 0);
      callback();
    });
  }
  if (directionSelect) {
    directionSelect.addEventListener('change', callback);
  }
}
let refreshCountdownInterval = null;
export function setRefreshButtonLoading(loading, countdownSeconds = null) {
  const refreshBtn = document.getElementById('refresh-btn');
  const buttonText = refreshBtn?.querySelector('.ui-button-text');
  const buttonLoader = refreshBtn?.querySelector('.ui-button-loader');
  if (!refreshBtn) {
    return;
  }
  if (loading) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('loading');
    if (buttonLoader) buttonLoader.style.display = 'inline-block';
    if (countdownSeconds !== null && countdownSeconds > 0) {
      if (buttonText) {
        buttonText.textContent = `Espera ${countdownSeconds}s`;
      }
      setPanelState('cache');
    } else {
      if (buttonText) {
        buttonText.textContent = 'Actualizando...';
      }
      setPanelState('loading');
    }
  } else {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove('loading');
    if (buttonLoader) buttonLoader.style.display = 'none';
    if (buttonText) {
      buttonText.textContent = 'Actualizar precios';
    }
  }
}
export function startRefreshCountdown(seconds, onComplete) {
  if (refreshCountdownInterval) {
    clearInterval(refreshCountdownInterval);
  }
  let remaining = seconds;
  setRefreshButtonLoading(true, remaining);
  refreshCountdownInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      setRefreshButtonLoading(true, remaining);
    } else {
      clearInterval(refreshCountdownInterval);
      refreshCountdownInterval = null;
      setRefreshButtonLoading(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, 1000);
}
export function stopRefreshCountdown() {
  if (refreshCountdownInterval) {
    clearInterval(refreshCountdownInterval);
    refreshCountdownInterval = null;
  }
  setRefreshButtonLoading(false);
}
export function renderInfoCard(priceData) {
  const infoCard = document.getElementById('info-card');
  if (!infoCard) {
    return;
  }
  if (!priceData || Object.keys(priceData).length === 0) {
    infoCard.innerHTML = '<p class="info-empty">Los datos de precios se cargarán automáticamente</p>';
    return;
  }
  const formatPrice = (value) => {
    if (!value || value <= 0) return '—';
    return formatNumber(value, 2);
  };
  const formatPercent = (value) => {
    if (!value || isNaN(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatNumber(value, 2)}%`;
  };
  const arsBuy = priceData.ARS?.BUY || {};
  const arsSell = priceData.ARS?.SELL || {};
  const arsSpread = arsBuy.median && arsSell.median 
    ? calculateSpread(arsBuy.median, arsSell.median) 
    : 0;
  const arsDiff = arsBuy.best && arsBuy.median 
    ? calculatePercentageDiff(arsBuy.best, arsBuy.median) 
    : 0;
  const bobBuy = priceData.BOB?.BUY || {};
  const bobSell = priceData.BOB?.SELL || {};
  const bobSpread = bobBuy.median && bobSell.median 
    ? calculateSpread(bobBuy.median, bobSell.median) 
    : 0;
  const bobDiff = bobBuy.best && bobBuy.median 
    ? calculatePercentageDiff(bobBuy.best, bobBuy.median) 
    : 0;
  infoCard.innerHTML = `
    <div class="info-section">
      <h3 class="info-title">Argentina (ARS)</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">USDT BUY</span>
          <span class="info-value">${formatPrice(arsBuy.median)} ARS</span>
        </div>
        <div class="info-item">
          <span class="info-label">USDT SELL</span>
          <span class="info-value">${formatPrice(arsSell.median)} ARS</span>
        </div>
      </div>
      <div class="info-meta">
        <div class="info-meta-item">
          <span class="info-meta-label">Spread:</span>
          <span class="info-meta-value">${formatPercent(arsSpread)}</span>
        </div>
        <div class="info-meta-item">
          <span class="info-meta-label">Mejor vs Mediana:</span>
          <span class="info-meta-value">${formatPrice(arsBuy.best)} ARS (${formatPercent(arsDiff)})</span>
        </div>
      </div>
    </div>
    <div class="info-section">
      <h3 class="info-title">Bolivia (BOB)</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">USDT BUY</span>
          <span class="info-value">${formatPrice(bobBuy.median)} BOB</span>
        </div>
        <div class="info-item">
          <span class="info-label">USDT SELL</span>
          <span class="info-value">${formatPrice(bobSell.median)} BOB</span>
        </div>
      </div>
      <div class="info-meta">
        <div class="info-meta-item">
          <span class="info-meta-label">Spread:</span>
          <span class="info-meta-value">${formatPercent(bobSpread)}</span>
        </div>
        <div class="info-meta-item">
          <span class="info-meta-label">Mejor vs Mediana:</span>
          <span class="info-meta-value">${formatPrice(bobBuy.best)} BOB (${formatPercent(bobDiff)})</span>
        </div>
      </div>
    </div>
    <div class="info-disclaimer">
      <small>Precios de referencia basados en medianas de Binance P2P. Solo para uso informativo.</small>
    </div>
  `;
}
let referenceTableUIState = {
  market: 'ARS',
  side: 'BUY'
};
export function renderReferencePrices(priceData, timestamp) {
}
export function resetReferenceTableUIState() {
  referenceTableUIState = {
    market: 'ARS',
    side: 'BUY'
  };
  updateFilterButtons();
  const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (IS_DEV && typeof window !== 'undefined' && window.console) {
    console.log('[UI] Reference table UI state reset to:', referenceTableUIState);
  }
}
function updateFilterButtons() {
  const arsBtn = document.getElementById('filter-market-ars');
  const bobBtn = document.getElementById('filter-market-bob');
  if (arsBtn && bobBtn) {
    if (referenceTableUIState.market === 'ARS') {
      arsBtn.classList.add('active');
      bobBtn.classList.remove('active');
    } else {
      arsBtn.classList.remove('active');
      bobBtn.classList.add('active');
    }
  }
  const buyBtn = document.getElementById('filter-side-buy');
  const sellBtn = document.getElementById('filter-side-sell');
  if (buyBtn && sellBtn) {
    if (referenceTableUIState.side === 'BUY') {
      buyBtn.classList.add('active');
      sellBtn.classList.remove('active');
    } else {
      buyBtn.classList.remove('active');
      sellBtn.classList.add('active');
    }
  }
}
export function renderFilteredReferenceTable(referencePrices, uiState) {
  const referenceContent = document.getElementById('reference-prices-content');
  if (!referenceContent) {
    if (typeof window !== 'undefined' && window.console) {
      console.warn('[UI] Reference table: Container not found');
    }
    return;
  }
  if (!referencePrices) {
    referenceContent.innerHTML = '<p class="reference-empty">No hay precios de referencia cargados aún</p>';
    return;
  }
  const formatPrice = (value) => {
    if (!value || value <= 0) return '—';
    return formatNumber(value, 2);
  };
  const market = uiState.market.toLowerCase();
  const side = uiState.side.toLowerCase();
  const key = `${market}_${side}`;
  const filteredPrices = referencePrices[key] || [];
  const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  if (IS_DEV && typeof window !== 'undefined' && window.console) {
    console.log('[UI] Rendering filtered reference price table');
    console.log('[UI] Active market:', uiState.market);
    console.log('[UI] Active side:', uiState.side);
    console.log('[UI] Rows to render:', filteredPrices.length);
  }
  const sideColor = uiState.side === 'BUY' ? '#16a34a' : '#dc2626';
  const sideColorLight = uiState.side === 'BUY' 
    ? 'rgba(22, 163, 74, 0.1)' 
    : 'rgba(220, 38, 38, 0.1)';
  if (!filteredPrices || filteredPrices.length === 0) {
    referenceContent.innerHTML = `
      <div class="reference-table-container">
        <table class="reference-table reference-table-${side.toLowerCase()}">
          <thead>
            <tr>
              <th>Índice</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2" class="reference-empty">No hay precios de referencia para esta selección</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    return;
  }
  let tableRows = '';
  filteredPrices.forEach((item, index) => {
    const price = item.price || 0;
    tableRows += `
      <tr>
        <td class="index-cell">${index + 1}</td>
        <td class="price-cell" style="color: ${sideColor};">${formatPrice(price)}</td>
      </tr>
    `;
  });
  referenceContent.innerHTML = `
    <div class="reference-table-container">
      <table class="reference-table reference-table-${side.toLowerCase()}">
        <thead style="border-bottom: 2px solid ${sideColor};">
          <tr>
            <th>Índice</th>
            <th style="color: ${sideColor};">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}
export function renderReferenceTable(referencePrices) {
  const referencePanel = document.getElementById('reference-prices-panel');
  const collapsableContent = document.getElementById('reference-collapsable-content');
  if (!referencePanel) {
    if (typeof window !== 'undefined' && window.console) {
      console.warn('[UI] Reference panel: Panel not found');
    }
    return;
  }
  if (!collapsableContent) {
    if (typeof window !== 'undefined' && window.console) {
      console.warn('[UI] Reference panel: Content element not found');
    }
    return;
  }
  referencePanel.style.display = 'block';
  if (collapsableContent) {
    collapsableContent.style.display = 'none';
  }
  const toggleBtn = document.getElementById('reference-toggle-btn');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
  setupReferencePricesToggle();
}
export function hideReferenceTable() {
  const collapsableContent = document.getElementById('reference-collapsable-content');
  if (collapsableContent) {
    collapsableContent.style.display = 'none';
  }
  const toggleBtn = document.getElementById('reference-toggle-btn');
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-expanded', 'false');
  }
}
export function toggleReferenceContent() {
  const collapsableContent = document.getElementById('reference-collapsable-content');
  const toggleBtn = document.getElementById('reference-toggle-btn');
  if (!collapsableContent || !toggleBtn) {
    return;
  }
  const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  if (isExpanded) {
    collapsableContent.style.display = 'none';
    toggleBtn.setAttribute('aria-expanded', 'false');
  } else {
    collapsableContent.style.display = 'block';
    toggleBtn.setAttribute('aria-expanded', 'true');
    const referencePrices = getCurrentReferencePrices();
    if (referencePrices) {
      renderFilteredReferenceTable(referencePrices, referenceTableUIState);
      setupReferenceFilters();
    } else {
      const referenceContent = document.getElementById('reference-prices-content');
      if (referenceContent) {
        referenceContent.innerHTML = '<p class="reference-empty">No hay precios de referencia cargados aún. Actualizá los precios para ver la tabla.</p>';
      }
    }
  }
}
export function setupReferenceFilters() {
  const marketButtons = document.querySelectorAll('.market-filter');
  marketButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const market = btn.getAttribute('data-market');
      if (market && (market === 'ARS' || market === 'BOB')) {
        referenceTableUIState.market = market;
        updateFilterButtons();
        const referencePrices = getCurrentReferencePrices();
        if (referencePrices) {
          renderFilteredReferenceTable(referencePrices, referenceTableUIState);
        }
        const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (IS_DEV && typeof window !== 'undefined' && window.console) {
          console.log('[UI] Reference table market changed to:', market);
        }
      }
    });
  });
  const sideButtons = document.querySelectorAll('.side-filter');
  sideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const side = btn.getAttribute('data-side');
      if (side && (side === 'BUY' || side === 'SELL')) {
        referenceTableUIState.side = side;
        updateFilterButtons();
        const referencePrices = getCurrentReferencePrices();
        if (referencePrices) {
          renderFilteredReferenceTable(referencePrices, referenceTableUIState);
        }
        const IS_DEV = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        if (IS_DEV && typeof window !== 'undefined' && window.console) {
          console.log('[UI] Reference table side changed to:', side);
        }
      }
    });
  });
}
export function getCurrentReferencePrices() {
  return window.currentReferencePrices || null;
}
export function showSuccessToast(message) {
  const toast = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toast || !toastMessage) {
    return;
  }
  toastMessage.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
export function setupReferencePricesToggle() {
  const toggleBtn = document.getElementById('reference-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleReferenceContent();
    });
  }
  function waitForFilters() {
    const marketButtons = document.querySelectorAll('.market-filter');
    const sideButtons = document.querySelectorAll('.side-filter');
    if (marketButtons.length > 0 && sideButtons.length > 0) {
      updateFilterButtons();
      setupReferenceFilters();
      return true;
    }
    return false;
  }
  if (waitForFilters()) {
    return;
  }
  setTimeout(() => {
    if (!waitForFilters()) {
      const observer = new MutationObserver(() => {
        if (waitForFilters()) {
          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      setTimeout(() => {
        observer.disconnect();
        waitForFilters();
      }, 2000);
    }
  }, 100);
}