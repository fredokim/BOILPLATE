import type { RouteRecordRaw } from "vue-router";

export const componentRoutes: RouteRecordRaw[] = [
  {
    path: "alert",
    name: "alert",
    component: () => import("@/modules/component/views/Alert.vue"),
    meta: { layout: "default", title: "알림" },
  },
  {
    path: "dialog",
    name: "dialog",
    component: () => import("@/modules/component/views/Dialog.vue"),
    meta: { layout: "default", title: "다이얼로그" },
  },
  {
    path: "color",
    name: "color",
    component: () => import("@/modules/component/views/ColorPreview.vue"),
    meta: { layout: "default", title: "컬러" },
  },
];
