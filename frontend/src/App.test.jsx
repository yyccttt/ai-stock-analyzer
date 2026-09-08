import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { LANGUAGE_KEY, messages } from './lib/i18n';

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LANGUAGE_KEY, 'zh');
});

describe('App language switcher', () => {
  it('switches the full interface to English and persists the choice', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(messages.zh.heroAccent)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(screen.getByText(messages.en.heroAccent)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.en.startAnalysis })).toBeDisabled();
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
