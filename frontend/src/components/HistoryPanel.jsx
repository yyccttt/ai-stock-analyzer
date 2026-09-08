import { formatCurrency, formatDate, formatPercent } from '../lib/format';

export default function HistoryPanel({ history, onSelect, onClear, copy, language }) {
  return (
    <aside className="history-card">
      <div className="history-heading">
        <div>
          <span className="eyebrow">{copy.historyKicker}</span>
          <h2>{copy.historyTitle}</h2>
        </div>
        {history.length > 0 && (
          <button type="button" className="text-button muted" onClick={onClear}>{copy.clear}</button>
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
                <small>{formatDate(item.savedAt, language)}</small>
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
          <p>{copy.historyEmpty}</p>
        </div>
      )}
    </aside>
  );
}
