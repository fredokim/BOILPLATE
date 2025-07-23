<script setup lang="ts">
import { computed } from "vue";
import type { ThemeColorKey } from "@core/theme/themeColors";

const props = defineProps<{
  color?: ThemeColorKey; // 이제 테마 키만 받습니다
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  variant?: "solid" | "outline" | "ghost";
}>();

const base = computed(() => props.color ?? "primary");

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "px-3 py-1 text-sm";
    case "lg":
      return "px-5 py-3 text-lg";
    default:
      return "px-4 py-2 text-base";
  }
});
</script>

<template>
  <button
    :class="[
      sizeClass,
      rounded ? 'rounded-full' : 'rounded-md',
      props.variant === 'outline'
        ? `border border-${base} text-${base} hover:bg-${base}/10`
        : props.variant === 'ghost'
          ? `bg-transparent text-${base} hover:bg-${base}/10`
          : `bg-${base} text-white hover:opacity-90`,
    ]"
  >
    <slot />
  </button>
</template>
@/app/core/theme/themeColors
