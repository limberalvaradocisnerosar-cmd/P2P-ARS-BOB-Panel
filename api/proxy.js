const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    const isVercelOrigin = origin.includes('vercel.app') || origin.includes('vercel.com');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    if (isVercelOrigin || isLocalhost) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  try {
    const { asset, fiat, tradeType, rows } = req.body;

    if (!asset || !fiat || !tradeType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (!['USDT', 'BTC', 'ETH'].includes(asset)) {
      return res.status(400).json({ error: 'Invalid asset' });
    }

    if (!['ARS', 'BOB'].includes(fiat)) {
      return res.status(400).json({ error: 'Invalid fiat currency' });
    }

    if (!['BUY', 'SELL'].includes(tradeType)) {
      return res.status(400).json({ error: 'Invalid trade type' });
    }

    const validRows = Math.min(Math.max(parseInt(rows) || 15, 1), 20);

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

    if (!data || !data.data || !Array.isArray(data.data)) {
      return res.status(500).json({ error: 'Invalid response format from Binance' });
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json(data);
  } catch (error) {
    const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      console.error('[Proxy] Error:', error);
    }
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
}

