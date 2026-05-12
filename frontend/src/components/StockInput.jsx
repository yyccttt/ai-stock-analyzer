import { useState } from 'react';

export default function StockInput({ onAnalyze, loading }) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = symbol.trim();
    if (!trimmed) return;
    onAnalyze(trimmed);
  };

  return (
    <form className="stock-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="输入美股代码，如 AAPL, TSLA, MSFT"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !symbol.trim()}>
        {loading ? '分析中...' : '分析'}
      </button>
    </form>
  );
}
