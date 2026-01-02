import { formatNumber, calculateSpread, calculatePercentageDiff } from './calc.js';

export function setResult(value) {
  const resultElement = document.getElementById('result');
  
  if (!resultElement) {
    return;
  }

  resultElement.textContent = value;
  resultElement.className = '';
}

export function setLoading(state) {
  const resultElement = document.getElementById('result');
  
  if (!resultElement) {
    return;
  }

  if (state) {
    resultElement.textContent = 'Cargando...';
    resultElement.className = 'loading';
  } else {
    resultElement.className = '';
  }
}

export function setError(message) {
  const resultElement = document.getElementById('result');
  
  if (!resultElement) {
    return;
  }

  resultElement.textContent = message || 'Error al obtener precios';
  resultElement.className = 'error';
}

/**
 * SECURITY: Sanitized amount retrieval
 */
export function getAmount() {
  const amountInput = document.getElementById('amount');
  
  if (!amountInput) {
    return 0;
  }

  // Obtener el valor numérico limpio almacenado en el data attribute
  const cleanValue = amountInput.dataset.numericValue;
  
  if (!cleanValue || cleanValue === '') {
    return 0;
  }
  
  const number = parseFloat(cleanValue);
  
  // SECURITY: Validate number
  if (isNaN(number) || !isFinite(number) || number < 0) {
    return 0;
  }
  
  // SECURITY: Prevent extremely large numbers (potential abuse)
  if (number > 1000000000000) { // 1 trillion max
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

/**
 * Formatea un valor numérico con separadores de miles y decimales
 * 1000000.5 → "1.000.000,5"
 * Soporta números infinitamente grandes (millones, billones, trillones, etc.)
 */
function formatMonetaryInput(value) {
  if (!value || value === '') {
    return '';
  }
  
  // Remover todo excepto dígitos y coma
  let cleaned = value.replace(/[^\d,]/g, '');
  
  // Manejar múltiples comas: mantener solo la primera
  const commaIndex = cleaned.indexOf(',');
  if (commaIndex !== -1) {
    const beforeComma = cleaned.substring(0, commaIndex).replace(/,/g, '');
    const afterComma = cleaned.substring(commaIndex + 1).replace(/,/g, '');
    cleaned = beforeComma + ',' + afterComma;
  }
  
  // Separar parte entera y decimal
  const parts = cleaned.split(',');
  let integerPart = parts[0] || '';
  const decimalPart = parts[1] || '';
  
  // Remover ceros iniciales en la parte entera, pero mantener al menos un dígito si hay contenido
  // IMPORTANTE: No remover ceros si el número es muy grande (millones, billones, etc.)
  if (integerPart.length > 0) {
    // Solo remover ceros iniciales si hay más de un dígito
    // Esto evita que números como "1000000" se conviertan en "1" incorrectamente
    if (integerPart.length > 1) {
      integerPart = integerPart.replace(/^0+/, '');
      // Si después de remover ceros queda vacío, significa que era solo ceros
      if (integerPart === '') {
        if (decimalPart === '') {
          integerPart = '';
        } else {
          integerPart = '0';
        }
      }
    }
    // Si tiene solo un dígito y es "0", solo mantenerlo si hay decimales
    else if (integerPart === '0' && decimalPart === '') {
      integerPart = '';
    }
  }
  
  // Agregar separadores de miles a la parte entera (funciona con cualquier longitud)
  // Esta regex funciona con números de cualquier tamaño (millones, billones, trillones, etc.)
  if (integerPart && integerPart.length > 0) {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  
  // Reconstruir el valor formateado
  let formatted = integerPart;
  if (decimalPart !== '') {
    formatted += ',' + decimalPart;
  }
  
  return formatted;
}

/**
 * Convierte un valor formateado a número limpio
 * "1.000.000,50" → 1000000.50
 */
function parseMonetaryInput(formattedValue) {
  if (!formattedValue || formattedValue === '') {
    return null;
  }
  
  // Remover puntos (separadores de miles)
  let cleaned = formattedValue.replace(/\./g, '');
  
  // Reemplazar coma por punto (separador decimal)
  cleaned = cleaned.replace(/,/g, '.');
  
  // Parsear a número
  const number = parseFloat(cleaned);
  
  return isNaN(number) ? null : number;
}

/**
 * Preserva la posición del cursor después de formatear
 */
function setCursorPosition(input, originalPosition, originalValue, newValue) {
  // Calcular cuántos caracteres no numéricos había antes del cursor
  const beforeCursor = originalValue.substring(0, originalPosition);
  const nonNumericBefore = (beforeCursor.match(/[^\d]/g) || []).length;
  
  // Contar dígitos antes del cursor
  const digitsBefore = beforeCursor.replace(/[^\d]/g, '').length;
  
  // Encontrar la posición en el nuevo valor que corresponde a los mismos dígitos
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
  
  // Ajustar si estamos en medio de un separador
  if (newPosition < newValue.length && /[^\d]/.test(newValue[newPosition])) {
    newPosition++;
  }
  
  // Establecer la nueva posición del cursor
  setTimeout(() => {
    input.setSelectionRange(newPosition, newPosition);
  }, 0);
}

// Actualizar badge de moneda según dirección
function updateCurrencyBadge() {
  const direction = getDirection();
  const badge = document.getElementById('input-currency-badge');
  if (badge) {
    badge.textContent = direction === 'ARS_BOB' ? 'ARS' : 'BOB';
  }
}

// Actualizar precios mostrados en resultado
export function updateResultPrices(priceFrom, priceTo, direction) {
  const priceFromEl = document.getElementById('result-price-from');
  const priceToEl = document.getElementById('result-price-to');
  
  if (priceFromEl && priceToEl) {
    if (direction === 'ARS_BOB') {
      priceFromEl.textContent = `ARS: ${formatNumber(priceFrom, 2)}`;
      priceToEl.textContent = `BOB: ${formatNumber(priceTo, 2)}`;
    } else {
      priceFromEl.textContent = `BOB: ${formatNumber(priceFrom, 2)}`;
      priceToEl.textContent = `ARS: ${formatNumber(priceTo, 2)}`;
    }
  }
}

// Setup botón swap
export function setupSwapButton() {
  const swapButton = document.getElementById('swap-button');
  const directionSelect = document.getElementById('direction');
  
  if (!swapButton || !directionSelect) return;
  
  swapButton.addEventListener('click', () => {
    // Animación de rotación
    swapButton.classList.add('rotating');
    setTimeout(() => {
      swapButton.classList.remove('rotating');
    }, 300);
    
    // Cambiar dirección
    const currentValue = directionSelect.value;
    directionSelect.value = currentValue === 'ARS_BOB' ? 'BOB_ARS' : 'ARS_BOB';
    
    // Disparar evento change para que main.js lo detecte
    directionSelect.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Actualizar badge
    updateCurrencyBadge();
  });
}

export function setupInputListeners(callback) {
  const amountInput = document.getElementById('amount');
  const directionSelect = document.getElementById('direction');

  // Actualizar badge cuando cambia dirección
  if (directionSelect) {
    directionSelect.addEventListener('change', () => {
      updateCurrencyBadge();
      callback();
    });
  }

  // Inicializar badge
  updateCurrencyBadge();

  if (amountInput) {
    // Input event: formatear en tiempo real mientras el usuario escribe
    amountInput.addEventListener('input', (e) => {
      const input = e.target;
      const originalValue = input.value;
      const originalPosition = input.selectionStart || 0;
      
      // Formatear el valor
      const formatted = formatMonetaryInput(originalValue);
      
      // Parsear a número limpio y guardar en data attribute
      const numericValue = parseMonetaryInput(formatted);
      input.dataset.numericValue = numericValue !== null ? numericValue.toString() : '';
      
      // Actualizar el valor formateado
      if (formatted !== originalValue) {
        input.value = formatted;
        // Preservar posición del cursor
        setCursorPosition(input, originalPosition, originalValue, formatted);
      }
      
      // Calcular en tiempo real
      callback();
    });
    
    // Blur event: completar decimales a 2 dígitos si hay coma
    amountInput.addEventListener('blur', (e) => {
      const input = e.target;
      const value = input.value;
      
      // Si hay coma pero no hay decimales o solo uno, completar a 2
      if (value.includes(',')) {
        const parts = value.split(',');
        const integerPartRaw = parts[0] || '';
        let decimalPart = parts[1] || '';
        
        // Remover separadores de miles de la parte entera para procesar
        const integerPartClean = integerPartRaw.replace(/\./g, '');
        
        // Completar decimales a 2 dígitos
        if (decimalPart.length === 0) {
          decimalPart = '00';
        } else if (decimalPart.length === 1) {
          decimalPart = decimalPart + '0';
        } else if (decimalPart.length > 2) {
          decimalPart = decimalPart.substring(0, 2);
        }
        
        // Reconstruir valor completo y parsear
        const fullValue = integerPartClean + (decimalPart ? ',' + decimalPart : '');
        const numericValue = parseMonetaryInput(fullValue);
        
        if (numericValue !== null) {
          // Formatear el valor completo
          const formatted = formatMonetaryInput(fullValue);
          input.value = formatted;
          input.dataset.numericValue = numericValue.toString();
        }
      }
      
      callback();
    });
    
    // Focus event: mantener el valor formateado (no hacer nada especial)
    amountInput.addEventListener('focus', (e) => {
      // El valor ya está formateado, no necesitamos hacer nada
    });
    
    // Keydown: permitir solo números, puntos, comas y teclas de control
    amountInput.addEventListener('keydown', (e) => {
      const allowedKeys = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Home', 'End'
      ];
      
      if (allowedKeys.includes(e.key)) {
        return;
      }
      
      // Permitir Ctrl/Cmd + A, C, V, X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      
      // Permitir solo números, punto y coma
      // Nota: Permitimos punto y coma, pero el formateo los convertirá correctamente
      if (!/[0-9.,]/.test(e.key)) {
        e.preventDefault();
      }
    });
    
    // Paste event: formatear el valor pegado
    amountInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      
      // Remover todo excepto dígitos y coma
      const cleaned = pastedText.replace(/[^\d,]/g, '');
      
      // Obtener el valor actual y la posición del cursor
      const input = e.target;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value;
      
      // Insertar el texto pegado en la posición del cursor
      const newValue = currentValue.substring(0, start) + cleaned + currentValue.substring(end);
      
      // Formatear el nuevo valor
      const formatted = formatMonetaryInput(newValue);
      const numericValue = parseMonetaryInput(formatted);
      
      input.value = formatted;
      input.dataset.numericValue = numericValue !== null ? numericValue.toString() : '';
      
      // Posicionar cursor al final
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
  const buttonText = refreshBtn?.querySelector('.cta-button-text');
  const cacheBadge = document.getElementById('cache-badge');
  const cacheCountdown = document.getElementById('cache-countdown');
  
  if (!refreshBtn) {
    return;
  }

  if (loading) {
    refreshBtn.disabled = true;
    refreshBtn.classList.add('loading');
    
    if (countdownSeconds !== null && countdownSeconds > 0) {
      if (buttonText) {
        buttonText.textContent = `Espera ${countdownSeconds}s`;
      }
      if (cacheCountdown) {
        cacheCountdown.textContent = `${countdownSeconds}s`;
      }
      if (cacheBadge) {
        cacheBadge.style.display = 'flex';
      }
    } else {
      if (buttonText) {
        buttonText.textContent = 'Actualizando...';
      }
      if (cacheBadge) {
        cacheBadge.style.display = 'none';
      }
    }
  } else {
    refreshBtn.disabled = false;
    refreshBtn.classList.remove('loading');
    if (buttonText) {
      buttonText.textContent = 'Actualizar precios';
    }
    if (cacheBadge) {
      cacheBadge.style.display = 'none';
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

let activeMarket = 'ARS';
let activeSide = 'BUY';

export function renderReferencePrices(priceData, timestamp) {
  const referenceContent = document.getElementById('reference-prices-content');
  
  if (!referenceContent) {
    console.log('Reference panel: Content element not found');
    return;
  }

  console.log('Reference panel render called');

  referenceContent.innerHTML = `
    <div class="reference-filters">
      <div class="filter-group">
        <span class="filter-label">Mercado:</span>
        <div class="filter-buttons">
          <button class="filter-btn market-filter ${activeMarket === 'ARS' ? 'active' : ''}" data-market="ARS">ARS</button>
          <button class="filter-btn market-filter ${activeMarket === 'BOB' ? 'active' : ''}" data-market="BOB">BOB</button>
        </div>
      </div>
      <div class="filter-group">
        <span class="filter-label">Tipo:</span>
        <div class="filter-buttons">
          <button class="filter-btn side-filter buy-filter ${activeSide === 'BUY' ? 'active' : ''}" data-side="BUY">BUY</button>
          <button class="filter-btn side-filter sell-filter ${activeSide === 'SELL' ? 'active' : ''}" data-side="SELL">SELL</button>
        </div>
      </div>
    </div>
    <div id="reference-prices-table-container" class="reference-table-container"></div>
  `;

  setupReferenceFilters();
}

export function renderReferenceTable(referencePrices) {
  renderFilteredReferenceTable(referencePrices, activeMarket, activeSide);
}

export function renderFilteredReferenceTable(referencePrices, market, side) {
  console.log('Rendering filtered reference price table');
  console.log('Active market:', market);
  console.log('Active side:', side);
  
  const tableContainer = document.getElementById('reference-prices-table-container');
  if (!tableContainer) {
    console.log('Reference table: Container not found');
    return;
  }

  if (!referencePrices) {
    tableContainer.innerHTML = '<p class="reference-empty">No reference prices loaded yet</p>';
    console.log('Reference table: No data, showing placeholder');
    return;
  }

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const date = new Date(ts);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatPrice = (value) => {
    if (!value || value <= 0) return '—';
    return formatNumber(value, 2);
  };

  const marketLower = market.toLowerCase();
  const sideLower = side.toLowerCase();
  const key = `${marketLower}_${sideLower}`;
  
  const filteredPrices = referencePrices[key] || [];
  
  console.log('Filtered prices:', filteredPrices);

  if (!filteredPrices || filteredPrices.length === 0) {
    tableContainer.innerHTML = '<p class="reference-empty">No reference prices for this selection</p>';
    console.log('Reference table: No data for selected filter');
    return;
  }

  const rowClass = side === 'BUY' ? 'buy-row' : 'sell-row';
  let tableRows = '';

  filteredPrices.forEach(item => {
    tableRows += `
      <tr class="${rowClass}">
        <td class="price-value">${formatPrice(item.price)}</td>
        <td class="timestamp-value">${formatTimestamp(item.timestamp)}</td>
      </tr>
    `;
  });

  tableContainer.innerHTML = `
    <table class="reference-table">
      <thead>
        <tr>
          <th>Price</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
  
  console.log('Reference table: Rendered successfully');
}

function setupReferenceFilters() {
  const marketButtons = document.querySelectorAll('.market-filter');
  const sideButtons = document.querySelectorAll('.side-filter');

  marketButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const market = btn.getAttribute('data-market');
      activeMarket = market;
      
      marketButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      console.log('Active market:', activeMarket);
      
      const referencePrices = getCurrentReferencePrices();
      if (referencePrices) {
        renderFilteredReferenceTable(referencePrices, activeMarket, activeSide);
      }
    });
  });

  sideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const side = btn.getAttribute('data-side');
      activeSide = side;
      
      sideButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      console.log('Active side:', activeSide);
      
      const referencePrices = getCurrentReferencePrices();
      if (referencePrices) {
        renderFilteredReferenceTable(referencePrices, activeMarket, activeSide);
      }
    });
  });
}

function getCurrentReferencePrices() {
  return window.currentReferencePrices || null;
}

export function setupReferencePricesToggle() {
  const toggleBtn = document.getElementById('reference-prices-toggle');
  
  if (!toggleBtn) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  });
}
