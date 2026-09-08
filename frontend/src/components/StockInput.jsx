import { useState } from 'react';

export default function StockInput({ onAnalyze, loading, mode, onModeChange, copy }) {
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
          <span className="eyebrow">{copy.lookupKicker}</span>
          <h2>{copy.searchTitle}</h2>
        </div>
        <div className="mode-switch" aria-label={copy.analysisMode}>
          <button
            type="button"
            className={mode === 'ai' ? 'active' : ''}
            onClick={() => onModeChange('ai')}
          >
            {copy.aiMode}
          </button>
          <button
            type="button"
            className={mode === 'quick' ? 'active' : ''}
            onClick={() => onModeChange('quick')}
          >
            {copy.quickMode}
          </button>
        </div>
      </div>

      <label className="input-label" htmlFor="stock-symbol">
        {copy.symbolLabel}
      </label>
      <div className="search-row">
        <div className="symbol-field">
          <span className="symbol-prefix" aria-hidden="true">$</span>
          <input
            id="stock-symbol"
            type="text"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder={copy.symbolPlaceholder}
            autoComplete="off"
            spellCheck="false"
            maxLength={10}
            disabled={loading}
            aria-describedby="symbol-help"
          />
        </div>
        <button className="primary-button" type="submit" disabled={loading || !isValid}>
          {loading ? copy.analyzing : copy.startAnalysis}
        </button>
      </div>
      <p id="symbol-help" className="field-help">{copy.symbolHelp}</p>
    </form>
  );
}
