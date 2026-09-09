import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';

export default function ComparisonPanel({
  onCompare,
  loading,
  data,
  onOpenSymbol,
  copy,
  language,
  initialSymbols = 'AAPL, MSFT, NVDA',
  onExport = () => {},
}) {
  const [symbols, setSymbols] = useState(initialSymbols);

  useEffect(() => {
    setSymbols(initialSymbols);
  }, [initialSymbols]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onCompare(symbols);
  };

  return (
    <section className="comparison-card">
      <div className="search-heading comparison-heading">
        <div>
          <span className="eyebrow">{copy.comparisonKicker}</span>
          <h2>{copy.comparisonTitle}</h2>
        </div>
        <div className="comparison-tools">
          <span className="limit-note">{copy.comparisonLimit}</span>
          {data?.length > 0 && (
            <button className="secondary-button" type="button" onClick={onExport}>
              {copy.exportComparison}
            </button>
          )}
        </div>
      </div>
      <form className="compare-form" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="compare-symbols">{copy.comparisonLabel}</label>
        <div className="search-row">
          <input
            id="compare-symbols"
            value={symbols}
            onChange={(event) => setSymbols(event.target.value.toUpperCase())}
            placeholder={copy.comparisonPlaceholder}
            disabled={loading}
          />
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? copy.comparing : copy.startComparison}
          </button>
        </div>
      </form>

      {data?.length > 0 ? (
        <div className="table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>{copy.stock}</th>
                <th>{copy.price}</th>
                <th>{copy.change}</th>
                <th>{copy.volume}</th>
                <th>{copy.rangePosition}</th>
                <th><span className="sr-only">{copy.openAnalysis}</span></th>
              </tr>
            </thead>
            <tbody>
              {data.map((stock) => (
                <tr key={stock.symbol}>
                  <td data-label={copy.stock}>
                    <strong>{stock.symbol}</strong>
                    <span>{language === 'zh' ? stock.name : copy.usEquity}</span>
                  </td>
                  <td data-label={copy.price}>{formatCurrency(stock.price)}</td>
                  <td
                    data-label={copy.change}
                    className={stock.changePercent >= 0 ? 'positive-text' : 'negative-text'}
                  >
                    {formatPercent(stock.changePercent)}
                  </td>
                  <td data-label={copy.volume}>{formatNumber(stock.volume, language)}</td>
                  <td data-label={copy.rangePosition}>
                    <div className="mini-range">
                      <span style={{ width: `${stock.metrics?.position52Week || 0}%` }} />
                    </div>
                    <small>{(stock.metrics?.position52Week || 0).toFixed(1)}%</small>
                  </td>
                  <td className="comparison-action">
                    <button className="text-button" type="button" onClick={() => onOpenSymbol(stock.symbol)}>
                      {copy.openAnalysis} →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-comparison">
          <div className="empty-chart" aria-hidden="true">
            <span style={{ height: '35%' }} />
            <span style={{ height: '70%' }} />
            <span style={{ height: '50%' }} />
            <span style={{ height: '90%' }} />
          </div>
          <h3>{copy.comparisonEmptyTitle}</h3>
          <p>{copy.comparisonEmptyBody}</p>
        </div>
      )}
    </section>
  );
}
