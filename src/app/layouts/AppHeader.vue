<script setup lang="ts">
import { ref } from "vue";

import { useLayoutSettings } from "@core/composables/useLayoutSettings";
import { getStoredTheme } from "@core/theme/utils";
import { toggleTheme } from "@core/composables/useTheme";

const { layoutMode, toggleLayoutMode } = useLayoutSettings();
const currentTheme = ref(getStoredTheme());
</script>

<template>
  <header
    class="h-16 px-6 flex items-center justify-between bg-white border-b shadow-sm"
  >
    <h1 class="text-lg font-bold">App Header</h1>

    <button
      @click="toggleLayoutMode"
      class="text-sm text-blue-600 hover:underline"
    >
      {{
        layoutMode === "sidebar"
          ? "Switch to Header Layout"
          : "Switch to Sidebar Layout"
      }}
    </button>

    <button
      @click="toggleTheme"
      class="px-4 py-2 rounded border border-gray-400 text-sm"
    >
      {{ currentTheme === "dark" ? "🌙 다크 모드" : "🌞 라이트 모드" }}
    </button>
  </header>
</template>
@/app/core/composables/useLayoutSettings@/app/core/theme/utils@/app/core/composables/useTheme
