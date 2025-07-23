<template>
  <div class="card">
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>

    <!-- 카드 본문 영역 -->
    <section class="card-body">
      <slot />
    </section>

    <!-- 카드 푸터 영역 (slot="footer") -->
    <footer v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
@import "@/components/atom/baseCard.scss";
</style>
