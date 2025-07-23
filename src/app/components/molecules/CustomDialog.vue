<script lang="ts" setup>
import { Component, ref } from "vue";
import { emitter } from "@core/service/event-bus.service";

const visible = ref(false);
// dynamic component
const comp = ref<null | string | Component>(null);
// dynamic props
const propsData = ref<Record<string, unknown>>({});

emitter.on("dialog", (payload) => {
  comp.value = payload.component;
  propsData.value = payload.props || {};
  visible.value = true;
});

function close() {
  visible.value = false;
}
</script>

<template>
  <div v-if="visible" class="dialog-overlay">
    <component :is="comp" v-bind="propsData" @close="close" />
  </div>
</template>

<style lang="scss" scoped></style>
