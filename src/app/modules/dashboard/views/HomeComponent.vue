<script lang="ts" setup>
import ColorPreview from "@/modules/component/views/ColorPreview.vue";
import OpenButton from "@/modules/component/views/OpenButton.vue";
</script>

<template>
  <div>
    <ColorPreview />

    <OpenButton />
  </div>
</template>

<style lang="scss" scoped>
.theme-test-container {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;

  .box {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-weight: bold;
    color: var(--color-background);
  }

  .primary {
    background-color: var(--color-primary);
  }

  .bg {
    background-color: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-text);
  }

  .text {
    background-color: var(--color-text);
  }
}
</style>
