import { beforeEach, describe, expect, it } from 'vitest';
import {
  LANGUAGE_KEY,
  detectLanguage,
  getErrorMessage,
  messages,
  saveLanguage,
} from './i18n';

beforeEach(() => localStorage.clear());

describe('translations', () => {
  it('keeps Chinese and English translation keys in sync', () => {
    expect(Object.keys(messages.en).sort()).toEqual(Object.keys(messages.zh).sort());
    expect(Object.keys(messages.en.errors).sort()).toEqual(Object.keys(messages.zh.errors).sort());
  });

  it('persists a supported language', () => {
    saveLanguage('en');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
    expect(detectLanguage()).toBe('en');
  });

  it('ignores unsupported language values', () => {
    saveLanguage('fr');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBeNull();
  });

  it('localizes structured API errors', () => {
    expect(getErrorMessage({ code: 'STOCK_NOT_FOUND' }, messages.en))
      .toBe('No market data was found for that ticker');
  });
});
