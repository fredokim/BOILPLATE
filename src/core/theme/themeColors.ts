import { lightTheme, colorKeys, darkTheme } from "./tokens";

export type ThemeColorKey = (typeof colorKeys)[number];
export type ThemeMode = "light" | "dark";

export interface ThemeColor {
  name: ThemeColorKey;
  hex: string;
  variable: string;
}

export function getThemeColors(mode: ThemeMode = "light"): ThemeColor[] {
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return colorKeys.map((key) => ({
    name: key,
    hex: theme[key],
    variable: `--color-${key}`,
  }));
}
