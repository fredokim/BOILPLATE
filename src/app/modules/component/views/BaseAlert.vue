<script lang="ts" setup>
import Card from "@/components/atom/Card.vue";

const items = [
  { type: "error" },
  { type: "success" },
  { type: "info" },
  { type: "warning" },
];
</script>

<template>
  <div class="flex flex-col gap-3">
    <Card>
      <template #header>Basic</template>
      <div class="flex flex-col gap-4">
        <div v-for="(item, index) in items" :key="index">
          <div
            class="alert-snackbar px-3 py-5 alert--basic"
            :class="[`alert--${item.type}`, 'text-white']"
          >
            {{ `This is an ${item.type} alert — check it out!` }}
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <template #header>Filled</template>
      <div class="flex flex-col gap-4">
        <div v-for="(item, index) in items" :key="index">
          <div
            class="alert-snackbar px-3 py-5 alert--filled"
            :class="[`alert--${item.type}`, 'text-white']"
          >
            {{ `This is an ${item.type} alert — check it out!` }}
          </div>
        </div>
      </div>
    </Card>

    <Card>
      <template #header>Outlined</template>
      <div class="flex flex-col gap-4">
        <div v-for="(item, index) in items" :key="index">
          <div
            class="alert-snackbar px-3 py-5 alert--outlined"
            :class="[`alert--${item.type}`, 'text-white']"
          >
            {{ `This is an ${item.type} alert — check it out!` }}
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<style lang="scss" scoped></style>
