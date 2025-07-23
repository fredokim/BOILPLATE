<script lang="ts" setup>
import { ref } from "vue";
import { emitter } from "@core/service/event-bus.service";

const visible = ref(false);
const message = ref("");
const type = ref<"success" | "error" | "info" | "warning">("info");
const variant = ref<"basic" | "filled" | "outlined">("basic");
let timer: number;

emitter.on("alert", (payload) => {
  clearTimeout(timer);
  message.value = payload.message;
  type.value = payload.type ?? "info";
  variant.value = payload.variant ?? "basic";
  visible.value = true;

  timer = window.setTimeout(() => {
    visible.value = false;
  }, payload.duration ?? 3000);
});
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="alert-snackbar"
      :class="[
        'toast',
        `alert--${variant}` /* basic, filled, outlined */,
        `alert--${type}` /* success, error, warning, info */,
        'text-white',
      ]"
    >
      {{ message }}
    </div>
  </transition>
</template>

<style lang="scss" scoped></style>
