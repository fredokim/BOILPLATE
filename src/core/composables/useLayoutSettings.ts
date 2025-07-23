import { computed } from "vue";
import { useCookie } from "./useCookie"; // ✅ 우리가 직접 만든 커스텀 composable

type LayoutMode = "sidebar" | "header";

const layoutModeCookie = useCookie<LayoutMode>("layout-mode", {
  defaultValue: "sidebar",
  fallbackToLocalStorage: true,
  expires: 30, // days
});
export function useLayoutSettings() {
  const mode = layoutModeCookie.value;

  const isSidebar = computed(() => mode.value === "sidebar");
  const isHeader = computed(() => mode.value === "header");

  function toggleLayoutMode() {
    mode.value = mode.value === "sidebar" ? "header" : "sidebar";
  }

  function setLayoutMode(newMode: LayoutMode) {
    mode.value = newMode;
  }

  function resetLayoutMode() {
    layoutModeCookie.remove();
    mode.value = "sidebar";
  }

  return {
    layoutMode: mode,
    isSidebar,
    isHeader,
    toggleLayoutMode,
    setLayoutMode,
    resetLayoutMode,
  };
}
