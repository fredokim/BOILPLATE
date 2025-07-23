export function applyTheme(theme: Record<string, string>) {
  const root = document.documentElement;

  for (const key in theme) {
    root.style.setProperty(`--color-${key}`, theme[key]);
  }
}
