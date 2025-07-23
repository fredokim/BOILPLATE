<script setup lang="ts">
import { computed } from "vue";
import { themeMode } from "@core/composables/useTheme";
import { getThemeColors, ThemeColor } from "@core/theme/themeColors";
import BaseButton from "@/components/atom/BaseButton.vue";

const themeColors = computed<ThemeColor[]>(() =>
  getThemeColors(themeMode.value)
);
</script>

<template>
  <div class="color-plate grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    <div
      v-for="color in themeColors"
      :key="color.name"
      class="color-item flex flex-col items-center"
    >
      <!-- 원(circle)에 CSS 변수로 설정된 배경색 적용 -->
      <div
        class="circle w-16 h-16 rounded-full border"
        :style="{ backgroundColor: `var(${color.variable})` }"
      />
      <div class="label mt-2 text-center text-sm">
        <div class="font-semibold">{{ color.name }}</div>
        <div class="text-xs text-gray-500">{{ color.hex }}</div>
        <div class="text-xs text-gray-400">{{ color.variable }}</div>
      </div>
      <BaseButton :color="color.name" size="md" variant="solid">
        색상 버튼
      </BaseButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.color-palette {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.color-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 0.5rem;
}

.color-swatch {
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  border: 1px solid #ccc;
  margin-bottom: 0.5rem;
}

.color-info {
  text-align: center;
  font-size: 0.875rem;
}
</style>
@/app/core/composables/useTheme@/app/core/theme/themeColors
