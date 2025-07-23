<script setup lang="ts">
import AlertSnackbar from "@/components/molecules/AlertSnackbar.vue";
import ConfirmDialog from "@/components/molecules/ConfirmDialog.vue";
import CustomDialog from "@/components/molecules/CustomDialog.vue";
</script>

<template>
  <router-view />
  <alert-snackbar />
  <confirm-dialog />
  <custom-dialog />
</template>
