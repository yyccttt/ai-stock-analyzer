import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AnalysisResult from './AnalysisResult';
import { messages } from '../lib/i18n';

const stockData = {
  symbol: 'AAPL',
  name: '苹果',
  price: 200,
  previousClose: 195,
  change: 5,
  changePercent: 2.56,
  open: 198,
  high: 202,
  low: 196,
  volume: 1_234_567,
  week52Low: 120,
  week52High: 240,
  metrics: {
    intradayRangePercent: 3.08,
    position52Week: 66.67,
    gapFrom52WeekHigh: -16.67,
  },
};

const analysis = {
  summary: 'Detailed summary',
  sentiment: 'bullish',
  risk_level: 'medium',
  confidence: 72,
  highlights: ['Observation'],
  risks: ['Risk'],
  source: 'rule-based',
};

function renderResult(language = 'zh') {
  render(
    <AnalysisResult
      stockData={stockData}
      analysis={analysis}
      onSave={vi.fn()}
      saveStatus={null}
      isFavorite={false}
      onToggleFavorite={vi.fn()}
      onExport={vi.fn()}
      onCopy={vi.fn()}
      copy={messages[language]}
      language={language}
    />
  );
}

describe('AnalysisResult movement breakdown', () => {
  it('shows four localized price-movement signals', () => {
    renderResult('zh');
    expect(screen.getByRole('heading', { name: '价格波动拆解' })).toBeInTheDocument();
    expect(screen.getByText('较昨收')).toBeInTheDocument();
    expect(screen.getByText('+2.56%')).toBeInTheDocument();
    expect(screen.getByText('日内振幅')).toBeInTheDocument();
    expect(screen.getByText('3.08%')).toBeInTheDocument();
  });

  it('renders the movement explanation in English', () => {
    renderResult('en');
    expect(screen.getByRole('heading', { name: 'Price movement breakdown' })).toBeInTheDocument();
    expect(screen.getByText('vs. previous close')).toBeInTheDocument();
    expect(screen.getByText('Buyers have led since the open')).toBeInTheDocument();
  });
});
