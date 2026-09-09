import { useEffect, useState } from 'react';
import StockInput from './components/StockInput';
import AnalysisResult from './components/AnalysisResult';
import ComparisonPanel from './components/ComparisonPanel';
import HistoryPanel from './components/HistoryPanel';
import { analyzeStock, compareStocks, fetchStock, syncAnalysis } from './lib/api';
import { detectLanguage, getErrorMessage, messages, saveLanguage } from './lib/i18n';
import { buildComparisonCsv, downloadTextFile } from './lib/export';
import { detectTheme, saveTheme } from './lib/theme';
import {
  clearHistory,
  loadHistory,
  loadWatchlist,
  saveHistoryRecord,
  toggleWatchlist,
} from './lib/storage';
import './App.css';

export default function App() {
  const [language, setLanguage] = useState(detectLanguage);
  const [activeView, setActiveView] = useState('analyze');
  const [theme, setTheme] = useState(detectTheme);
  const [mode, setMode] = useState('ai');
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [comparisonSeed, setComparisonSeed] = useState('AAPL, MSFT, NVDA');
  const [loading, setLoading] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [saveStatus, setSaveStatus] = useState(null);
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [history, setHistory] = useState(loadHistory);
  const copy = messages[language];

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = copy.pageTitle;
  }, [copy.pageTitle, language]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleLanguageChange = async (nextLanguage) => {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
    setError('');

    if (stockData && analysis) {
      setLoading(true);
      setSaveStatus(null);
      try {
        setAnalysis(await analyzeStock(stockData, mode, nextLanguage));
      } catch (err) {
        setError(getErrorMessage(err, messages[nextLanguage]));
      } finally {
        setLoading(false);
      }
    }
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
      setAnalysis(await analyzeStock(stock, mode, language));
    } catch (err) {
      setError(getErrorMessage(err, copy));
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (input) => {
    const symbols = [...new Set(
      input.split(/[\s,]+/).map((item) => item.trim().toUpperCase()).filter(Boolean)
    )];
    if (symbols.length < 2 || symbols.length > 5) {
      setError(copy.errors.compareCount);
      return;
    }
    setComparisonLoading(true);
    setError('');
    try {
      const result = await compareStocks(symbols);
      setComparison(result.data);
    } catch (err) {
      setError(getErrorMessage(err, copy));
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleSave = async () => {
    const record = {
      id: `${stockData.symbol}-${Date.now()}`,
      savedAt: new Date().toISOString(),
      language,
      stockData,
      analysis,
    };
    setSaveStatus('saving');
    setHistory((current) => saveHistoryRecord(record, current));
    try {
      await syncAnalysis({ symbol: stockData.symbol, stockData, analysis });
      setSaveStatus('cloud');
      notify(copy.toastCloudSaved);
    } catch {
      setSaveStatus('local');
      notify(copy.toastLocalSaved);
    }
  };

  const handleExport = () => {
    const payload = JSON.stringify({
      language,
      stockData,
      analysis,
      exportedAt: new Date().toISOString(),
    }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${stockData.symbol}-analysis-${language}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify(copy.toastExported);
  };

  const handleCopy = async () => {
    const text = `${stockData.symbol} ${stockData.price}\n${analysis.summary}\n${copy.riskNotes}: ${analysis.risk_level}`;
    try {
      await navigator.clipboard.writeText(text);
      notify(copy.toastCopied);
    } catch {
      setError(copy.errors.clipboard);
    }
  };

  const handleToggleFavorite = () => {
    setWatchlist((current) => toggleWatchlist(stockData.symbol, current));
  };

  const handleHistorySelect = async (record) => {
    setStockData(record.stockData);
    setError('');
    setSaveStatus('local');
    if (!record.language || record.language === language) {
      setAnalysis(record.analysis);
    } else {
      setLoading(true);
      try {
        const selectedMode = record.analysis?.source === 'deepseek' ? 'ai' : 'quick';
        setAnalysis(await analyzeStock(record.stockData, selectedMode, language));
      } catch (err) {
        setError(getErrorMessage(err, copy));
      } finally {
        setLoading(false);
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSymbol = (symbol) => {
    setActiveView('analyze');
    window.setTimeout(() => handleAnalyze(symbol), 0);
  };

  const handleCompareWatchlist = () => {
    if (watchlist.length < 2) {
      setError(copy.errors.watchlistCompareCount);
      return;
    }
    const symbols = watchlist.slice(0, 5).join(', ');
    setComparisonSeed(symbols);
    setActiveView('compare');
    window.setTimeout(() => handleCompare(symbols), 0);
  };

  const handleComparisonExport = () => {
    const csv = buildComparisonCsv(comparison, {
      stock: copy.stock,
      price: copy.price,
      change: copy.change,
      volume: copy.volume,
      rangePosition: copy.rangePosition,
    });
    downloadTextFile(csv, `signal-desk-comparison-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    notify(copy.toastComparisonExported);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Signal Desk">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>
            <strong>Signal Desk</strong>
            <small>{copy.brandTagline}</small>
          </span>
        </a>
        <nav aria-label={copy.analysisMode}>
          <button
            type="button"
            className={activeView === 'analyze' ? 'active' : ''}
            onClick={() => { setActiveView('analyze'); setError(''); }}
          >
            {copy.navAnalyze}
          </button>
          <button
            type="button"
            className={activeView === 'compare' ? 'active' : ''}
            onClick={() => { setActiveView('compare'); setError(''); }}
          >
            {copy.navCompare}
          </button>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? copy.useLightTheme : copy.useDarkTheme}
          >
            {theme === 'dark' ? copy.lightTheme : copy.darkTheme}
          </button>
          <div className="language-switch" role="group" aria-label={copy.languageLabel}>
            <button
              type="button"
              className={language === 'zh' ? 'active' : ''}
              onClick={() => handleLanguageChange('zh')}
              aria-pressed={language === 'zh'}
            >
              中文
            </button>
            <button
              type="button"
              className={language === 'en' ? 'active' : ''}
              onClick={() => handleLanguageChange('en')}
              aria-pressed={language === 'en'}
            >
              EN
            </button>
          </div>
          <div className="market-status"><span /> {copy.marketData}</div>
        </div>
      </header>

      <main>
        <section className="hero">
          <span className="hero-kicker">{copy.heroKicker}</span>
          <h1><span>{copy.heroTitle}</span> <em>{copy.heroAccent}</em></h1>
          <p>{copy.heroDescription}</p>
        </section>

        <div className="view-tabs" role="tablist" aria-label={copy.analysisMode}>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'analyze'}
            className={activeView === 'analyze' ? 'active' : ''}
            onClick={() => setActiveView('analyze')}
          >
            {copy.navAnalyze}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'compare'}
            className={activeView === 'compare' ? 'active' : ''}
            onClick={() => setActiveView('compare')}
          >
            {copy.navCompare}
          </button>
        </div>

        {error && (
          <div className="error-box" role="alert">
            <span>!</span>
            <div><strong>{copy.errorTitle}</strong><p>{error}</p></div>
            <button type="button" onClick={() => setError('')} aria-label={copy.close}>×</button>
          </div>
        )}

        {activeView === 'analyze' ? (
          <div className="dashboard-grid">
            <div className="primary-column">
              <StockInput
                onAnalyze={handleAnalyze}
                loading={loading}
                mode={mode}
                onModeChange={setMode}
                copy={copy}
              />

              <section className="watchlist-bar" aria-label={copy.watchlist}>
                <span>{copy.watchlist}</span>
                <div>
                  {watchlist.length ? watchlist.map((symbol) => (
                    <button type="button" key={symbol} onClick={() => handleAnalyze(symbol)}>
                      {symbol}
                    </button>
                  )) : <small>{copy.watchlistEmpty}</small>}
                </div>
                {watchlist.length >= 2 && (
                  <button className="watchlist-compare" type="button" onClick={handleCompareWatchlist}>
                    {copy.compareWatchlist}
                  </button>
                )}
              </section>

              {loading && (
                <div className="loading-card" aria-live="polite">
                  <div className="pulse-orbit"><span /></div>
                  <div><strong>{copy.loadingTitle}</strong><p>{copy.loadingBody}</p></div>
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
                  copy={copy}
                  language={language}
                />
              )}

              {!loading && !analysis && (
                <div className="starter-panel">
                  <div className="starter-line" />
                  <div><strong>{copy.starterTitle}</strong><p>{copy.starterBody}</p></div>
                </div>
              )}
            </div>

            <HistoryPanel
              history={history}
              onSelect={handleHistorySelect}
              onClear={() => { clearHistory(); setHistory([]); notify(copy.toastCleared); }}
              copy={copy}
              language={language}
            />
          </div>
        ) : (
          <ComparisonPanel
            onCompare={handleCompare}
            loading={comparisonLoading}
            data={comparison}
            onOpenSymbol={handleOpenSymbol}
            copy={copy}
            language={language}
            initialSymbols={comparisonSeed}
            onExport={handleComparisonExport}
          />
        )}
      </main>

      <footer>
        <span>{copy.footerProduct}</span>
        <p>{copy.footerDisclaimer}</p>
      </footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
