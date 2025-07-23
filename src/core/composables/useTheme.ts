// src/core/theme/useTheme.ts
import { ref, watch } from "vue";
import { getStoredTheme, setStoredTheme } from "@core/theme/utils";
import { lightTheme, darkTheme } from "@core/theme/tokens";
import { applyTheme } from "@core/theme/theme";

export const themeMode = ref<"light" | "dark">(getStoredTheme());

watch(
  themeMode,
  (mode) => {
    const tokens = mode === "dark" ? darkTheme : lightTheme;
    applyTheme(tokens);
    document.documentElement.setAttribute("data-theme", mode);
    setStoredTheme(mode);
  },
  { immediate: true }
);

export function toggleTheme() {
  themeMode.value = themeMode.value === "dark" ? "light" : "dark";
}
