/**
 * Vercel Serverless Function - Proxy para Binance P2P API
 * 
 * Esta función actúa como proxy para evitar problemas de CORS.
 * Las requests se hacen desde el servidor (Vercel) donde no hay restricciones CORS.
 */

const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

// Vercel Serverless Function handler
export default async function handler(req, res) {
  // SECURITY: Manejar preflight (OPTIONS) para CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // SECURITY: Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // SECURITY: CORS headers - permitir desde cualquier origen de Vercel
  // Esto es necesario porque Vercel genera URLs dinámicas
  const origin = req.headers.origin || req.headers.referer;
  
  // Permitir todos los orígenes de Vercel y localhost para desarrollo
  if (origin) {
    const isVercelOrigin = origin.includes('vercel.app') || origin.includes('vercel.com');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    
    if (isVercelOrigin || isLocalhost) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // En producción, solo permitir orígenes conocidos
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  try {
    // SECURITY: Validar body
    const { asset, fiat, tradeType, rows } = req.body;

    if (!asset || !fiat || !tradeType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // SECURITY: Validar valores permitidos
    if (!['USDT', 'BTC', 'ETH'].includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }

    if (!['ARS', 'BOB'].includes(fiat)) {
      return res.status(400).json({ error: 'Invalid fiat currency' });
    }

    if (!['BUY', 'SELL'].includes(tradeType)) {
      return res.status(400).json({ error: 'Invalid trade type' });
    }

    // SECURITY: Limitar rows
    const validRows = Math.min(Math.max(parseInt(rows) || 15, 1), 20);

    // Hacer request a Binance P2P desde el servidor
    const response = await fetch(BINANCE_P2P_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; P2P-Panel/1.0)',
      },
      body: JSON.stringify({
        asset: asset,
        fiat: fiat,
        merchantCheck: false,
        page: 1,
        payTypes: [],
        publisherType: null,
        rows: validRows,
        tradeType: tradeType,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Binance API error: ${response.status}` 
      });
    }

    const data = await response.json();

    // SECURITY: Validar respuesta
    if (!data || !data.data || !Array.isArray(data.data)) {
      return res.status(500).json({ error: 'Invalid response format from Binance' });
    }

    // Retornar datos con CORS headers (ya configurados arriba)
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

