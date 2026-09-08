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
      throw new Error(body?.error?.message || body?.error || `请求失败（${response.status}）`);
    }
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('请求超时，请稍后重试');
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function fetchStock(symbol) {
  return request(`/api/stock/${encodeURIComponent(symbol)}`);
}

export function analyzeStock(stockData, mode) {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ stockData, mode }),
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
