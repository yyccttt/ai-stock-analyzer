import { useState } from 'react';
import StockInput from './components/StockInput';
import AnalysisResult from './components/AnalysisResult';
import ComparisonPanel from './components/ComparisonPanel';
import HistoryPanel from './components/HistoryPanel';
import { analyzeStock, compareStocks, fetchStock, syncAnalysis } from './lib/api';
import {
  clearHistory,
  loadHistory,
  loadWatchlist,
  saveHistoryRecord,
  toggleWatchlist,
} from './lib/storage';
import './App.css';

export default function App() {
  const [activeView, setActiveView] = useState('analyze');
  const [mode, setMode] = useState('ai');
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [history, setHistory] = useState(loadHistory);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleAnalyze = async (symbol) => {
    setLoading(true);
    setError('');
    setStockData(null);
    setAnalysis(null);
    setSaveStatus(null);
    try {
      const stock = await fetchStock(symbol);
      setStockData(stock);
      const result = await analyzeStock(stock, mode);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (input) => {
    const symbols = [...new Set(
      input.split(/[\s,]+/).map((item) => item.trim().toUpperCase()).filter(Boolean)
    )];
    if (symbols.length < 2 || symbols.length > 5) {
      setError('请输入 2-5 个不同的股票代码');
      return;
    }
    setComparisonLoading(true);
    setError('');
    try {
      const result = await compareStocks(symbols);
      setComparison(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleSave = async () => {
    const record = {
      id: `${stockData.symbol}-${Date.now()}`,
      savedAt: new Date().toISOString(),
      stockData,
      analysis,
    };
    setSaveStatus('saving');
    setHistory((current) => saveHistoryRecord(record, current));
    try {
      await syncAnalysis({ symbol: stockData.symbol, stockData, analysis });
      setSaveStatus('cloud');
      notify('已保存到本地并同步至云端');
    } catch {
      setSaveStatus('local');
      notify('已保存到当前浏览器；云端未配置或暂不可用');
    }
  };

  const handleExport = () => {
    const payload = JSON.stringify({ stockData, analysis, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stockData.symbol}-analysis.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('JSON 报告已导出');
  };

  const handleCopy = async () => {
    const text = `${stockData.symbol} ${stockData.price}\n${analysis.summary}\n风险：${analysis.risk_level}`;
    try {
      await navigator.clipboard.writeText(text);
      notify('分析摘要已复制');
    } catch {
      setError('浏览器未授权剪贴板访问');
    }
  };

  const handleToggleFavorite = () => {
    setWatchlist((current) => toggleWatchlist(stockData.symbol, current));
  };

  const handleHistorySelect = (record) => {
    setStockData(record.stockData);
    setAnalysis(record.analysis);
    setSaveStatus('local');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSymbol = (symbol) => {
    setActiveView('analyze');
    window.setTimeout(() => handleAnalyze(symbol), 0);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Signal Desk 首页">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>
            <strong>Signal Desk</strong>
            <small>AI MARKET INTELLIGENCE</small>
          </span>
        </a>
        <nav aria-label="主要功能">
          <button
            type="button"
            className={activeView === 'analyze' ? 'active' : ''}
            onClick={() => { setActiveView('analyze'); setError(''); }}
          >
            单股分析
          </button>
          <button
            type="button"
            className={activeView === 'compare' ? 'active' : ''}
            onClick={() => { setActiveView('compare'); setError(''); }}
          >
            横向对比
          </button>
        </nav>
        <div className="market-status"><span /> 美股行情</div>
      </header>

      <main>
        <section className="hero">
          <span className="hero-kicker">DECISIONS NEED CONTEXT</span>
          <h1>把行情快照变成<br /><em>清晰、可解释的信号。</em></h1>
          <p>实时行情、AI 辅助研判与可解释的快速评估，集中在一个安静的研究工作台。</p>
        </section>

        <div className="view-tabs" role="tablist" aria-label="分析视图">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'analyze'}
            className={activeView === 'analyze' ? 'active' : ''}
            onClick={() => setActiveView('analyze')}
          >
            单股分析
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'compare'}
            className={activeView === 'compare' ? 'active' : ''}
            onClick={() => setActiveView('compare')}
          >
            股票对比
          </button>
        </div>

        {error && (
          <div className="error-box" role="alert">
            <span>!</span>
            <div><strong>请求未完成</strong><p>{error}</p></div>
            <button type="button" onClick={() => setError('')} aria-label="关闭">×</button>
          </div>
        )}

        {activeView === 'analyze' ? (
          <>
            <div className="dashboard-grid">
              <div className="primary-column">
                <StockInput
                  onAnalyze={handleAnalyze}
                  loading={loading}
                  mode={mode}
                  onModeChange={setMode}
                />

                <section className="watchlist-bar" aria-label="自选股">
                  <span>自选</span>
                  <div>
                    {watchlist.length ? watchlist.map((symbol) => (
                      <button type="button" key={symbol} onClick={() => handleAnalyze(symbol)}>
                        {symbol}
                      </button>
                    )) : <small>在分析结果中点击星标添加</small>}
                  </div>
                </section>

                {loading && (
                  <div className="loading-card" aria-live="polite">
                    <div className="pulse-orbit"><span /></div>
                    <div><strong>正在构建分析</strong><p>获取行情并计算可解释指标…</p></div>
                  </div>
                )}

                {stockData && analysis && (
                  <AnalysisResult
                    stockData={stockData}
                    analysis={analysis}
                    onSave={handleSave}
                    saveStatus={saveStatus}
                    isFavorite={watchlist.includes(stockData.symbol)}
                    onToggleFavorite={handleToggleFavorite}
                    onExport={handleExport}
                    onCopy={handleCopy}
                  />
                )}

                {!loading && !analysis && (
                  <div className="starter-panel">
                    <div className="starter-line" />
                    <div>
                      <strong>从一只你熟悉的股票开始</strong>
                      <p>查询后将展示行情概览、52 周位置、风险等级和分析依据。</p>
                    </div>
                  </div>
                )}
              </div>

              <HistoryPanel
                history={history}
                onSelect={handleHistorySelect}
                onClear={() => { clearHistory(); setHistory([]); notify('本地历史已清空'); }}
              />
            </div>
          </>
        ) : (
          <ComparisonPanel
            onCompare={handleCompare}
            loading={comparisonLoading}
            data={comparison}
            onOpenSymbol={handleOpenSymbol}
          />
        )}
      </main>

      <footer>
        <span>Signal Desk v2.0</span>
        <p>行情可能存在延迟。所有分析仅供研究，不构成投资建议。</p>
      </footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
