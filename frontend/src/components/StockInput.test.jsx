import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StockInput from './StockInput';

function renderInput(overrides = {}) {
  const props = {
    onAnalyze: vi.fn(),
    loading: false,
    mode: 'ai',
    onModeChange: vi.fn(),
    ...overrides,
  };
  render(<StockInput {...props} />);
  return props;
}

describe('StockInput', () => {
  it('normalizes a valid symbol and submits it', async () => {
    const user = userEvent.setup();
    const props = renderInput();
    await user.type(screen.getByLabelText('美股代码'), 'aapl');
    await user.click(screen.getByRole('button', { name: '开始分析' }));
    expect(props.onAnalyze).toHaveBeenCalledWith('AAPL');
  });

  it('does not allow invalid symbols to be submitted', async () => {
    const user = userEvent.setup();
    renderInput();
    await user.type(screen.getByLabelText('美股代码'), 'AAPL/');
    expect(screen.getByRole('button', { name: '开始分析' })).toBeDisabled();
  });

  it('switches between AI and quick modes', async () => {
    const user = userEvent.setup();
    const props = renderInput();
    await user.click(screen.getByRole('button', { name: '快速评估' }));
    expect(props.onModeChange).toHaveBeenCalledWith('quick');
  });
});
