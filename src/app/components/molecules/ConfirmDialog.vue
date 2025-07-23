<script lang="ts" setup>
import { ref } from "vue";
import { emitter } from "@core/service/event-bus.service";

const visible = ref(false);
const message = ref("");
const confirmText = ref("확인");
const cancelText = ref("취소");
let onConfirmCb = () => {};
let onCancelCb = () => {
  visible.value = false;
};

emitter.on("confirm", (payload) => {
  message.value = payload.message;
  confirmText.value = payload.confirmText || "확인";
  cancelText.value = payload.cancelText || "취소";
  onConfirmCb = () => {
    payload.onConfirm();
    visible.value = false;
  };
  onCancelCb = () => {
    payload.onCancel?.();
    visible.value = false;
  };
  visible.value = true;
});

function confirm() {
  onConfirmCb();
}
function cancel() {
  onCancelCb();
}
</script>

<template>
  <transition name="fade">
    <div v-if="visible" class="modal-overlay" @click="cancel"></div>
  </transition>
  <transition name="scale-fade">
    <div v-if="visible" class="modal-panel-wrapper">
      <div class="modal-panel" @click.stop>
        <h3 class="modal-title">확인</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-buttons">
          <button class="btn btn-cancel" @click="cancel">
            {{ cancelText }}
          </button>
          <button class="btn btn-confirm" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss" scoped></style>
