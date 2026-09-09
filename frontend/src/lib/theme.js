export const THEME_KEY = 'signal-desk:theme:v1';
export const THEMES = ['light', 'dark'];

export function detectTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (THEMES.includes(saved)) return saved;
  } catch {
    // Fall back to the operating system preference.
  }
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function saveTheme(theme) {
  if (!THEMES.includes(theme)) return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Theme switching still works when storage is unavailable.
  }
}
