const WATCHLIST_KEY = 'signal-desk:watchlist:v1';
const HISTORY_KEY = 'signal-desk:history:v1';
const MAX_HISTORY = 12;

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app stays usable when storage is unavailable or full.
  }
  return value;
}

export function loadWatchlist() {
  const value = readJson(WATCHLIST_KEY, ['AAPL', 'MSFT', 'NVDA']);
  return Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === 'string'))].slice(0, 12)
    : [];
}

export function toggleWatchlist(symbol, current) {
  const normalized = symbol.toUpperCase();
  const next = current.includes(normalized)
    ? current.filter((item) => item !== normalized)
    : [normalized, ...current].slice(0, 12);
  return writeJson(WATCHLIST_KEY, next);
}

export function loadHistory() {
  const value = readJson(HISTORY_KEY, []);
  return Array.isArray(value) ? value.slice(0, MAX_HISTORY) : [];
}

export function saveHistoryRecord(record, current) {
  const deduplicated = current.filter((item) => item.stockData?.symbol !== record.stockData?.symbol);
  const next = [record, ...deduplicated].slice(0, MAX_HISTORY);
  return writeJson(HISTORY_KEY, next);
}

export function clearHistory() {
  return writeJson(HISTORY_KEY, []);
}

export { HISTORY_KEY, MAX_HISTORY, WATCHLIST_KEY };
