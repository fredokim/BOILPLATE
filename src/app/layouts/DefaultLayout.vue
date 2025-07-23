<script setup lang="ts">
import { useLayoutSettings } from "@core/composables/useLayoutSettings";

import AppHeader from "./AppHeader.vue";
import AppSideBar from "./AppSideBar.vue";

const { isSidebar, isHeader } = useLayoutSettings();
</script>

<template>
  <div class="app-layout">
    <AppHeader v-if="isHeader" />
    <div class="layout-body">
      <AppSideBar v-if="isSidebar" class="app-sidebar" />

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>
