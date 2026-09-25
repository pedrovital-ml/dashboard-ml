export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, refresh_token, url, access_token } = req.body || {};

  // Proxy mode: forward any ML API GET request server-side (avoids CORS)
  if (url && access_token) {
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/json' },
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Token exchange / refresh mode
  const body = refresh_token
    ? { grant_type: 'refresh_token', client_id: process.env.ML_CLIENT_ID, client_secret: process.env.ML_CLIENT_SECRET, refresh_token }
    : { grant_type: 'authorization_code', client_id: process.env.ML_CLIENT_ID, client_secret: process.env.ML_CLIENT_SECRET, code, redirect_uri: 'https://dashboardml-rho.vercel.app/' };

  try {
    const resp = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
