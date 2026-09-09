function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildComparisonCsv(data, labels) {
  const header = [labels.stock, labels.price, labels.change, labels.volume, labels.rangePosition];
  const rows = data.map((stock) => [
    stock.symbol,
    stock.price,
    stock.changePercent,
    stock.volume,
    stock.metrics?.position52Week ?? 0,
  ]);
  return `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')}`;
}

export function downloadTextFile(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
