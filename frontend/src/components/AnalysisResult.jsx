const sentimentMap = {
  bullish: { label: '看涨', className: 'sentiment-bullish' },
  bearish: { label: '看跌', className: 'sentiment-bearish' },
  neutral: { label: '中性', className: 'sentiment-neutral' },
};

const riskMap = {
  low: { label: '低', className: 'risk-low' },
  medium: { label: '中', className: 'risk-medium' },
  high: { label: '高', className: 'risk-high' },
};

export default function AnalysisResult({ stockData, analysis, onSave, saved }) {
  const sentimentInfo = sentimentMap[analysis.sentiment] || {};
  const riskInfo = riskMap[analysis.risk_level] || {};

  return (
    <div className="result-card">
      <h2>
        {stockData.symbol} — ${stockData.price.toFixed(2)}
      </h2>

      <div className="stock-meta">
        <span className={stockData.change >= 0 ? 'change-up' : 'change-down'}>
          {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent})
        </span>
        <span>成交量: {stockData.volume.toLocaleString()}</span>
        <span>最高: {stockData.high.toFixed(2)}</span>
        <span>最低: {stockData.low.toFixed(2)}</span>
      </div>

      <div className="analysis-section">
        <h3>AI 分析报告</h3>
        <p className="summary">{analysis.summary}</p>

        <div className="badges">
          <span className={`badge ${sentimentInfo.className}`}>
            情绪: {sentimentInfo.label}
          </span>
          <span className={`badge ${riskInfo.className}`}>
            风险: {riskInfo.label}
          </span>
        </div>
      </div>

      <button
        className="save-btn"
        onClick={onSave}
        disabled={saved}
      >
        {saved ? '已保存' : '保存到 Supabase'}
      </button>
    </div>
  );
}
