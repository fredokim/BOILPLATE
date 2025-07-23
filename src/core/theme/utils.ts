import { applyTheme } from "./theme";
import { darkTheme, lightTheme } from "./tokens";

export type ThemeMode = keyof typeof themes;

export const themes = {
  light: lightTheme,
  dark: darkTheme,
};

export function getStoredTheme(): "light" | "dark" {
  const theme = localStorage.getItem("theme");
  return theme === "dark" ? "dark" : "light";
}

export function setStoredTheme(theme: "light" | "dark") {
  localStorage.setItem("theme", theme);
}

export function setTheme(mode: keyof typeof themes) {
  const selected = themes[mode];
  applyTheme(selected);
  document.documentElement.setAttribute("data-theme", mode);
}

export function initTheme() {
  const currentTheme = getStoredTheme();
  const themeObject = currentTheme === "dark" ? darkTheme : lightTheme;
  applyTheme(themeObject);
  document.documentElement.setAttribute("data-theme", currentTheme);
}
