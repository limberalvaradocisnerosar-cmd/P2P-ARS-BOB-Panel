export function median(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

export function arsToBob(ars, usdtArsBuy, usdtBobSell) {
  if (!ars || !usdtArsBuy || !usdtBobSell || usdtArsBuy <= 0 || usdtBobSell <= 0) {
    return 0;
  }

  const usdt = ars / usdtArsBuy;
  const bob = usdt * usdtBobSell;

  return bob;
}

export function bobToArs(bob, usdtBobBuy, usdtArsSell) {
  if (!bob || !usdtBobBuy || !usdtArsSell || usdtBobBuy <= 0 || usdtArsSell <= 0) {
    return 0;
  }

  const usdt = bob / usdtBobBuy;
  const ars = usdt * usdtArsSell;

  return ars;
}

export function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Normaliza un string numérico con formato humano a número
 * Acepta: "10.000,50", "10000", "1.500"
 * Retorna: 10000.50, 10000, 1500
 */
export function normalizeAmountInput(input) {
  if (!input || typeof input !== 'string') {
    return 0;
  }
  
  // Remover espacios
  let cleaned = input.trim();
  
  if (cleaned === '') {
    return 0;
  }
  
  // Remover todos los puntos (separadores de miles)
  cleaned = cleaned.replace(/\./g, '');
  
  // Reemplazar coma por punto (separador decimal)
  cleaned = cleaned.replace(/,/g, '.');
  
  // Parsear a número
  const number = parseFloat(cleaned);
  
  return isNaN(number) || number < 0 ? 0 : number;
}

/**
 * Formatea un número para display en input
 * 10000.50 → "10.000,50"
 */
export function formatAmountForInput(value) {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return '';
  }
  
  // Formatear con separadores españoles
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  
  return formatted;
}

export function calculateSpread(buyPrice, sellPrice) {
  if (!buyPrice || !sellPrice || buyPrice <= 0) {
    return 0;
  }

  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

export function calculatePercentageDiff(best, median) {
  if (!best || !median || median <= 0) {
    return 0;
  }

  return ((best - median) / median) * 100;
}

export function getBestPrice(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return 0;
  }

  return Math.min(...prices);
}

export function filterAds(ads, minMonthOrders = 50, minFinishRate = 95) {
  if (!Array.isArray(ads) || ads.length === 0) {
    return [];
  }

  return ads.filter(ad => {
    if (!ad || typeof ad !== 'object') {
      return false;
    }

    if (ad.monthOrderCount < minMonthOrders) {
      return false;
    }

    if (ad.monthFinishRate < minFinishRate) {
      return false;
    }

    return true;
  });
}

export function removeOutliers(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return [];
  }

  if (prices.length <= 2) {
    return prices;
  }

  const sorted = [...prices].sort((a, b) => a - b);

  if (sorted.length <= 2) {
    return sorted;
  }

  return sorted.slice(1, -1);
}

export function filterAndProcessAds(ads, minMonthOrders = 50, minFinishRate = 95) {
  if (!Array.isArray(ads) || ads.length === 0) {
    return [];
  }

  const filtered = filterAds(ads, minMonthOrders, minFinishRate);

  if (filtered.length === 0) {
    return ads.map(ad => ad.price);
  }

  const prices = filtered.map(ad => ad.price);
  const withoutOutliers = removeOutliers(prices);

  if (withoutOutliers.length === 0) {
    return prices;
  }

  return withoutOutliers;
}
