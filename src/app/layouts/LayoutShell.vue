<script setup lang="ts">
import { useRoute } from "vue-router";
import { defineAsyncComponent, computed } from "vue";

interface CustomRouteMeta {
  layout?: "default" | "blank";
}

const route = useRoute();

const DefaultLayout = defineAsyncComponent(
  () => import("@/layouts/DefaultLayout.vue")
);
const BlankLayout = defineAsyncComponent(
  () => import("@/layouts/BlankLayout.vue")
);

const layoutComponent = computed(() => {
  const layout = (route.meta as CustomRouteMeta).layout;
  return layout === "blank" ? BlankLayout : DefaultLayout;
});
</script>

<template>
  <router-view v-slot="{ Component }">
    <component :is="layoutComponent">
      <!-- 
        실제 페이지 콘텐츠(예: Alert.vue, Dialog.vue, Home.vue 등)가 이 자리에 렌더되어야 합니다. 
        이 <slot/> 대신 <component :is="Component" /> 형태로 뿌려 주어야 합니다.
      -->
      <component :is="Component" />
    </component>
  </router-view>
</template>
