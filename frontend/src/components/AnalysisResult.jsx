import { formatCurrency, formatNumber, formatPercent } from '../lib/format';

export default function AnalysisResult({
  stockData,
  analysis,
  onSave,
  saveStatus,
  isFavorite,
  onToggleFavorite,
  onExport,
  onCopy,
  copy,
  language,
}) {
  const sentimentMap = {
    bullish: { label: copy.sentimentBullish, className: 'positive' },
    bearish: { label: copy.sentimentBearish, className: 'negative' },
    neutral: { label: copy.sentimentNeutral, className: 'neutral' },
  };
  const riskMap = {
    low: { label: copy.riskLow, className: 'positive' },
    medium: { label: copy.riskMedium, className: 'warning' },
    high: { label: copy.riskHigh, className: 'negative' },
  };
  const sentiment = sentimentMap[analysis.sentiment] || sentimentMap.neutral;
  const risk = riskMap[analysis.risk_level] || riskMap.medium;
  const isUp = stockData.change >= 0;
  const position = Math.min(100, Math.max(0, stockData.metrics?.position52Week || 0));
  const companyName = language === 'zh' ? (stockData.name || stockData.symbol) : stockData.symbol;

  return (
    <article className="result-card">
      <div className="result-topline">
        <div className="company-block">
          <button
            className={`favorite-button ${isFavorite ? 'selected' : ''}`}
            onClick={onToggleFavorite}
            type="button"
            aria-label={isFavorite ? copy.removeFavorite : copy.addFavorite}
            title={isFavorite ? copy.removeFavorite : copy.addFavorite}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          <div>
            <div className="company-name">{companyName}</div>
            <div className="ticker">{stockData.symbol} · {copy.usEquity}</div>
          </div>
        </div>
        <div className="source-note">
          <span className="live-dot" />
          {stockData.cached ? copy.cachedQuote : copy.latestQuote} · {stockData.sourceUpdatedAt || '—'}
        </div>
      </div>

      <div className="price-row">
        <strong>{formatCurrency(stockData.price)}</strong>
        <span className={isUp ? 'quote-change positive-text' : 'quote-change negative-text'}>
          {isUp ? '↗' : '↘'} {formatCurrency(Math.abs(stockData.change))} · {formatPercent(stockData.changePercent)}
        </span>
      </div>

      <div className="metrics-grid">
        <div><span>{copy.open}</span><strong>{formatCurrency(stockData.open)}</strong></div>
        <div><span>{copy.high}</span><strong>{formatCurrency(stockData.high)}</strong></div>
        <div><span>{copy.low}</span><strong>{formatCurrency(stockData.low)}</strong></div>
        <div><span>{copy.volume}</span><strong>{formatNumber(stockData.volume, language)}</strong></div>
      </div>

      <section className="range-section" aria-label={copy.range52}>
        <div className="range-heading">
          <span>{copy.range52}</span>
          <strong>{position.toFixed(1)}%</strong>
        </div>
        <div className="range-track">
          <span className="range-fill" style={{ width: `${position}%` }} />
          <span className="range-marker" style={{ left: `${position}%` }} />
        </div>
        <div className="range-labels">
          <span>{formatCurrency(stockData.week52Low)}</span>
          <span>{formatCurrency(stockData.week52High)}</span>
        </div>
      </section>

      <section className="analysis-section">
        <div className="analysis-heading">
          <div>
            <span className="eyebrow">{copy.analysisKicker}</span>
            <h3>{analysis.source === 'deepseek' ? copy.aiAnalysis : copy.quickAnalysis}</h3>
          </div>
          <div className="badges">
            <span className={`badge ${sentiment.className}`}>{sentiment.label}</span>
            <span className={`badge ${risk.className}`}>{risk.label}</span>
            <span className="badge confidence">{analysis.confidence}% {copy.confidence}</span>
          </div>
        </div>

        <p className="summary">{analysis.summary}</p>

        <div className="insight-grid">
          <div className="insight-panel">
            <h4><span className="insight-icon positive">+</span>{copy.observations}</h4>
            <ul>{(analysis.highlights || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="insight-panel">
            <h4><span className="insight-icon warning">!</span>{copy.riskNotes}</h4>
            <ul>{(analysis.risks || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>

        {analysis.notice && <div className="notice">{analysis.notice}</div>}
        <p className="disclaimer">{copy.disclaimer}</p>
      </section>

      <div className="result-actions">
        <button type="button" className="secondary-button" onClick={onCopy}>{copy.copySummary}</button>
        <button type="button" className="secondary-button" onClick={onExport}>{copy.exportJson}</button>
        <button type="button" className="primary-button" onClick={onSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving'
            ? copy.saving
            : saveStatus === 'cloud'
              ? copy.savedCloud
              : saveStatus === 'local'
                ? copy.savedLocal
                : copy.saveAnalysis}
        </button>
      </div>
    </article>
  );
}
