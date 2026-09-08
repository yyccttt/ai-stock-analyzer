export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatNumber(value, language = 'zh') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatPercent(value, withSign = true) {
  const numeric = Number(value) || 0;
  const sign = withSign && numeric > 0 ? '+' : '';
  return `${sign}${numeric.toFixed(2)}%`;
}

export function formatDate(value, language = 'zh') {
  if (!value) return language === 'en' ? 'Unknown time' : '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
