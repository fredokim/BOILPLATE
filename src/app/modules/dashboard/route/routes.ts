export const dashboardRoutes = [
  {
    path: "",
    name: "dashboard",
    component: () => import("@/modules/dashboard/views/Home.vue"),
    meta: { layout: "default", title: "대시보드" },
  },
];
