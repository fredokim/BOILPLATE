<script lang="ts" setup>
import { useAlert, useConfirm } from "@core/composables/useNotification";

// useAlert() 를 호출하면 Snackbar/Alert 메시지를 띄울 수 있습니다.
const alert = useAlert();

// useConfirm() 을 호출하면 ConfirmDialog 를 띄울 수 있습니다.
const confirm = useConfirm();

function showAlert() {
  // message, type, duration 를 순서대로 넘깁니다.
  alert("이것은 정보 메시지입니다.", "info", 3000);
}

// Confirm 버튼 핸들러
function showConfirm() {
  confirm(
    "정말 진행하시겠습니까?",
    () => {
      // 확인 클릭 시 실행될 로직
      alert("확인을 눌렀습니다!", "success", 3000);
    },
    () => {
      // 취소 클릭 시 실행될 로직 (옵션)
      alert("취소를 눌렀습니다.", "warning", 3000);
    },
    "진행", // 확인 버튼 텍스트 (옵션)
    "취소" // 취소 버튼 텍스트 (옵션)
  );
}

// Snackbar 버튼 핸들러 (alert 과 동일하게 사용)
function showSnackbar() {
  alert("이것은 스낵바 메시지입니다!", "success", 2500);
}
</script>

<template>
  <div class="flex items-center space-x-2 pt-3">
    <!-- Alert 버튼 -->
    <button
      @click="showAlert"
      class="px-4 py-2 rounded-md bg-primary text-white"
    >
      Show Alert
    </button>

    <!-- Confirm 버튼 -->
    <button
      @click="showConfirm"
      class="px-4 py-2 rounded-md bg-secondary text-white"
    >
      Show Confirm
    </button>

    <!-- Snackbar 버튼 (Alert과 동일) -->
    <button
      @click="showSnackbar"
      class="px-4 py-2 rounded-md bg-info text-white"
    >
      Show Snackbar
    </button>
  </div>
</template>

<style lang="scss" scoped></style>
@/app/core/composables/useNotification
