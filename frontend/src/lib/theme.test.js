import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectTheme, saveTheme, THEME_KEY } from './theme';

describe('theme preferences', () => {
  beforeEach(() => window.localStorage.clear());

  it('restores a saved preference', () => {
    window.localStorage.setItem(THEME_KEY, 'dark');
    expect(detectTheme()).toBe('dark');
  });

  it('persists supported themes only', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    saveTheme('light');
    saveTheme('sepia');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
