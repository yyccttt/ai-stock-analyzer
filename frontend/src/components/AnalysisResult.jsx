import { formatCurrency, formatNumber, formatPercent } from '../lib/format';

const sentimentMap = {
  bullish: { label: '偏强', className: 'positive' },
  bearish: { label: '偏弱', className: 'negative' },
  neutral: { label: '中性', className: 'neutral' },
};

const riskMap = {
  low: { label: '低风险', className: 'positive' },
  medium: { label: '中风险', className: 'warning' },
  high: { label: '高风险', className: 'negative' },
};

export default function AnalysisResult({
  stockData,
  analysis,
  onSave,
  saveStatus,
  isFavorite,
  onToggleFavorite,
  onExport,
  onCopy,
}) {
  const sentiment = sentimentMap[analysis.sentiment] || sentimentMap.neutral;
  const risk = riskMap[analysis.risk_level] || riskMap.medium;
  const isUp = stockData.change >= 0;
  const position = Math.min(100, Math.max(0, stockData.metrics?.position52Week || 0));

  return (
    <article className="result-card">
      <div className="result-topline">
        <div className="company-block">
          <button
            className={`favorite-button ${isFavorite ? 'selected' : ''}`}
            onClick={onToggleFavorite}
            type="button"
            aria-label={isFavorite ? '从自选股移除' : '加入自选股'}
            title={isFavorite ? '从自选股移除' : '加入自选股'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          <div>
            <div className="company-name">{stockData.name || stockData.symbol}</div>
            <div className="ticker">{stockData.symbol} · NASDAQ/NYSE</div>
          </div>
        </div>
        <div className="source-note">
          <span className="live-dot" />
          {stockData.cached ? '缓存行情' : '最新行情'} · {stockData.sourceUpdatedAt || '刚刚'}
        </div>
      </div>

      <div className="price-row">
        <strong>{formatCurrency(stockData.price)}</strong>
        <span className={isUp ? 'quote-change positive-text' : 'quote-change negative-text'}>
          {isUp ? '↗' : '↘'} {formatCurrency(Math.abs(stockData.change))} · {formatPercent(stockData.changePercent)}
        </span>
      </div>

      <div className="metrics-grid">
        <div><span>开盘</span><strong>{formatCurrency(stockData.open)}</strong></div>
        <div><span>最高</span><strong>{formatCurrency(stockData.high)}</strong></div>
        <div><span>最低</span><strong>{formatCurrency(stockData.low)}</strong></div>
        <div><span>成交量</span><strong>{formatNumber(stockData.volume)}</strong></div>
      </div>

      <section className="range-section" aria-label="52 周价格位置">
        <div className="range-heading">
          <span>52 周价格位置</span>
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
            <span className="eyebrow">ANALYSIS SIGNAL</span>
            <h3>{analysis.source === 'deepseek' ? 'AI 深度分析' : '快速量化评估'}</h3>
          </div>
          <div className="badges">
            <span className={`badge ${sentiment.className}`}>{sentiment.label}</span>
            <span className={`badge ${risk.className}`}>{risk.label}</span>
            <span className="badge confidence">{analysis.confidence}% 置信度</span>
          </div>
        </div>

        <p className="summary">{analysis.summary}</p>

        <div className="insight-grid">
          <div className="insight-panel">
            <h4><span className="insight-icon positive">+</span>关键观察</h4>
            <ul>
              {(analysis.highlights || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="insight-panel">
            <h4><span className="insight-icon warning">!</span>风险提示</h4>
            <ul>
              {(analysis.risks || []).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        {analysis.notice && <div className="notice">{analysis.notice}</div>}
        <p className="disclaimer">仅供研究与信息参考，不构成任何投资建议。</p>
      </section>

      <div className="result-actions">
        <button type="button" className="secondary-button" onClick={onCopy}>复制摘要</button>
        <button type="button" className="secondary-button" onClick={onExport}>导出 JSON</button>
        <button type="button" className="primary-button" onClick={onSave} disabled={saveStatus === 'saving'}>
          {saveStatus === 'saving'
            ? '保存中…'
            : saveStatus === 'cloud'
              ? '已保存并同步'
              : saveStatus === 'local'
                ? '已保存到本地'
                : '保存分析'}
        </button>
      </div>
    </article>
  );
}
