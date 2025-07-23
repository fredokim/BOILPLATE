import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import LayoutShell from "@/layouts/LayoutShell.vue";

const modules = import.meta.glob<{ [exportName: string]: RouteRecordRaw[] }>(
  ["../modules/**/router/routes.ts"],
  { eager: true }
);

const moduleRouteGroups: RouteRecordRaw[] = Object.entries(modules)
  .map(([filePath, moduleExports]) => {
    // filePath 예시: '/src/modules/auth/router/routes.ts'
    // (Vite의 import.meta.glob 은 경로 앞에 '/src'를 붙여서 리턴할 수도 있음)
    // 우선 상대경로로 바꾸기 위해 "modules/모듈명/router/routes.ts" 부분만 남기도록 매칭
    const match = filePath.match(/modules\/([^/]+)\/router\/routes\.ts$/);
    if (!match) {
      // 만약 예상치 못한 경로라면 무시
      return null;
    }
    // modules/{moduleName}/router/routes.ts 의 {moduleName} 부분 추출
    const moduleName = match[1]; // 예: 'auth', 'dashboard', 'component'

    // moduleExports 는 { authRoutes: RouteRecordRaw[] } 와 같은 객체
    // Object.values(moduleExports) 를 통해 “모듈 내 export 된 모든 RouteRecordRaw[]”를 배열로 꺼냄
    // (각 모듈 routes.ts 파일에서 export한 named export가 여러 개라면 모두 합침)
    const allRoutesForThisModule: RouteRecordRaw[] =
      Object.values(moduleExports).flat();

    // 부모 RouteRecordRaw 를 만든 뒤, children 에 allRoutesForThisModule 을 붙임
    return {
      path: `/${moduleName}`, // 모듈명 자체를 부모 path 로 사용
      name: moduleName, // (선택) 모듈명으로 라우터 이름 설정
      // 중첩된 children 이기 때문에, 렌더링만 해 주는 용도의 빈 wrapper 컴포넌트가 필요
      // 보통 <router-view>를 그려주면 됩니다. (vue-router 4에서는 component: RouterView 로 사용)
      component: () =>
        import("vue-router").then(({ RouterView }) => RouterView),
      children: allRoutesForThisModule,
    } as RouteRecordRaw;
  })
  .filter((r): r is RouteRecordRaw => r !== null);

export const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: LayoutShell, // ✅ App.vue를 라우터 트리의 layout component로 배치
    children: [
      {
        path: "/login",
        name: "Login", // 이름 추가
        component: () => import("@modules/auth/views/Login.vue"),
        meta: { layout: "blank" },
      },
      {
        path: "/dashboard",
        name: "Dashboard", // 이름 추가
        component: () => import("@modules/dashboard/views/HomeComponent.vue"),
        meta: { layout: "default" },
      },
      ...moduleRouteGroups,
      // {
      //   path: "/component",
      //   name: "ComponentParent",
      //   children: componentRoutes,
      //   meta: { layout: "default" },
      // },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
