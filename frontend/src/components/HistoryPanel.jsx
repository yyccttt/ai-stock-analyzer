import { formatCurrency, formatDate, formatPercent } from '../lib/format';

export default function HistoryPanel({ history, onSelect, onClear }) {
  return (
    <aside className="history-card">
      <div className="history-heading">
        <div>
          <span className="eyebrow">LOCAL ARCHIVE</span>
          <h2>最近分析</h2>
        </div>
        {history.length > 0 && (
          <button type="button" className="text-button muted" onClick={onClear}>清空</button>
        )}
      </div>
      {history.length ? (
        <div className="history-list">
          {history.map((item) => (
            <button
              type="button"
              className="history-item"
              key={item.id}
              onClick={() => onSelect(item)}
            >
              <span className="history-symbol">
                <strong>{item.stockData.symbol}</strong>
                <small>{formatDate(item.savedAt)}</small>
              </span>
              <span className="history-price">
                <strong>{formatCurrency(item.stockData.price)}</strong>
                <small className={item.stockData.changePercent >= 0 ? 'positive-text' : 'negative-text'}>
                  {formatPercent(item.stockData.changePercent)}
                </small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-history">
          <span>◎</span>
          <p>保存的分析会安全地保留在当前浏览器中。</p>
        </div>
      )}
    </aside>
  );
}
