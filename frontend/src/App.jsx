import { useState } from 'react';
import StockInput from './components/StockInput';
import AnalysisResult from './components/AnalysisResult';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

export default function App() {
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleAnalyze = async (symbol) => {
    setLoading(true);
    setError(null);
    setStockData(null);
    setAnalysis(null);
    setSaved(false);

    try {
      const stockRes = await fetch(`${API_BASE}/api/stock/${encodeURIComponent(symbol)}`);
      if (!stockRes.ok) {
        const e = await stockRes.json();
        throw new Error(e.error || 'Failed to fetch stock data');
      }
      const stock = await stockRes.json();
      setStockData(stock);

      const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockData: stock }),
      });
      if (!analyzeRes.ok) {
        const e = await analyzeRes.json();
        throw new Error(e.error || 'Analysis failed');
      }
      const result = await analyzeRes.json();
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: stockData.symbol,
          stockData,
          analysis,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Save failed');
      }
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI Stock Analyzer</h1>
        <p className="subtitle">输入美股代码，获取实时数据与AI分析</p>
      </header>

      <StockInput onAnalyze={handleAnalyze} loading={loading} />

      {error && <div className="error-box">{error}</div>}

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <p>正在分析中...</p>
        </div>
      )}

      {stockData && analysis && (
        <AnalysisResult
          stockData={stockData}
          analysis={analysis}
          onSave={handleSave}
          saved={saved}
        />
      )}
    </div>
  );
}
