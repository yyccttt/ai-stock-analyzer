const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(body?.error?.message || body?.error || `HTTP ${response.status}`);
      error.code = body?.error?.code || 'REQUEST_FAILED';
      throw error;
    }
    return body;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out');
      timeoutError.code = 'REQUEST_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function fetchStock(symbol) {
  return request(`/api/stock/${encodeURIComponent(symbol)}`);
}

export function analyzeStock(stockData, mode, language) {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ stockData, mode, language }),
  });
}

export function compareStocks(symbols) {
  return request('/api/stock/compare', {
    method: 'POST',
    body: JSON.stringify({ symbols }),
  });
}

export function syncAnalysis(payload) {
  return request('/api/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
