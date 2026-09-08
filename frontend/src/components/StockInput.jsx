import { useState } from 'react';

export default function StockInput({ onAnalyze, loading, mode, onModeChange }) {
  const [symbol, setSymbol] = useState('');
  const normalized = symbol.trim().toUpperCase();
  const isValid = /^[A-Z][A-Z0-9.-]{0,9}$/.test(normalized);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isValid) onAnalyze(normalized);
  };

  return (
    <form className="search-card" onSubmit={handleSubmit}>
      <div className="search-heading">
        <div>
          <span className="eyebrow">MARKET LOOKUP</span>
          <h2>研究一只股票</h2>
        </div>
        <div className="mode-switch" aria-label="分析模式">
          <button
            type="button"
            className={mode === 'ai' ? 'active' : ''}
            onClick={() => onModeChange('ai')}
          >
            AI 深度
          </button>
          <button
            type="button"
            className={mode === 'quick' ? 'active' : ''}
            onClick={() => onModeChange('quick')}
          >
            快速评估
          </button>
        </div>
      </div>

      <label className="input-label" htmlFor="stock-symbol">
        美股代码
      </label>
      <div className="search-row">
        <div className="symbol-field">
          <span className="symbol-prefix" aria-hidden="true">$</span>
          <input
            id="stock-symbol"
            type="text"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="AAPL"
            autoComplete="off"
            spellCheck="false"
            maxLength={10}
            disabled={loading}
            aria-describedby="symbol-help"
          />
        </div>
        <button className="primary-button" type="submit" disabled={loading || !isValid}>
          {loading ? '分析中…' : '开始分析'}
        </button>
      </div>
      <p id="symbol-help" className="field-help">
        支持 AAPL、TSLA、MSFT、BRK.B 等美股代码
      </p>
    </form>
  );
}
