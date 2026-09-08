const { AppError } = require('../errors');

function getConfig() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
  };
}

function isConfigured() {
  const { url, key } = getConfig();
  return Boolean(url && key);
}

async function saveAnalysis(record) {
  const { url, key } = getConfig();
  if (!url || !key) {
    throw new AppError(503, 'CLOUD_STORAGE_NOT_CONFIGURED', 'Cloud storage is not configured');
  }
  let response;
  try {
    response = await fetch(`${url}/rest/v1/stock_analyses`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify(record),
    });
  } catch (_error) {
    throw new AppError(502, 'CLOUD_STORAGE_UNAVAILABLE', 'Cloud storage is unavailable');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new AppError(502, 'CLOUD_STORAGE_REJECTED', 'Cloud storage rejected the record');
  }
  return { data, status: response.status };
}

module.exports = { isConfigured, saveAnalysis };
