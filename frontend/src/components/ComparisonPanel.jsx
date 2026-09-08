import { useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../lib/format';

export default function ComparisonPanel({ onCompare, loading, data, onOpenSymbol }) {
  const [symbols, setSymbols] = useState('AAPL, MSFT, NVDA');

  const handleSubmit = (event) => {
    event.preventDefault();
    onCompare(symbols);
  };

  return (
    <section className="comparison-card">
      <div className="search-heading">
        <div>
          <span className="eyebrow">SIDE BY SIDE</span>
          <h2>股票横向对比</h2>
        </div>
        <span className="limit-note">最多 5 只</span>
      </div>
      <form className="compare-form" onSubmit={handleSubmit}>
        <label className="input-label" htmlFor="compare-symbols">用逗号或空格分隔代码</label>
        <div className="search-row">
          <input
            id="compare-symbols"
            value={symbols}
            onChange={(event) => setSymbols(event.target.value.toUpperCase())}
            placeholder="AAPL, MSFT, NVDA"
            disabled={loading}
          />
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '载入中…' : '开始对比'}
          </button>
        </div>
      </form>

      {data?.length > 0 ? (
        <div className="table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>股票</th>
                <th>价格</th>
                <th>涨跌幅</th>
                <th>成交量</th>
                <th>52 周位置</th>
                <th><span className="sr-only">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {data.map((stock) => (
                <tr key={stock.symbol}>
                  <td>
                    <strong>{stock.symbol}</strong>
                    <span>{stock.name}</span>
                  </td>
                  <td>{formatCurrency(stock.price)}</td>
                  <td className={stock.changePercent >= 0 ? 'positive-text' : 'negative-text'}>
                    {formatPercent(stock.changePercent)}
                  </td>
                  <td>{formatNumber(stock.volume)}</td>
                  <td>
                    <div className="mini-range">
                      <span style={{ width: `${stock.metrics?.position52Week || 0}%` }} />
                    </div>
                    <small>{(stock.metrics?.position52Week || 0).toFixed(1)}%</small>
                  </td>
                  <td>
                    <button className="text-button" type="button" onClick={() => onOpenSymbol(stock.symbol)}>
                      分析 →
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
          <h3>快速识别相对强弱</h3>
          <p>一次查看价格、当日涨跌、成交量和 52 周区间位置。</p>
        </div>
      )}
    </section>
  );
}
