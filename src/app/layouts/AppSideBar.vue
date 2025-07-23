<script setup lang="ts">
import { reactive, computed } from "vue";
import { RouterLink } from "vue-router";
import { routes as mainRoutes } from "@/router/index";
import { useLayoutSettings } from "@core/composables/useLayoutSettings";

import type { RouteRecordRaw } from "vue-router";

interface SubMenu {
  name: string;
  label: string | symbol; // symbol 허용
  to: string;
}
interface MenuItem {
  name: string;
  label: string | symbol; // meta.title
  to?: string; // 하위 메뉴 없을 때만 정의
  children?: SubMenu[];
}

interface SidebarRoute extends Omit<RouteRecordRaw, "meta" | "children"> {
  meta: {
    title?: string;
    icon?: string;
  };
  children?: SidebarRoute[];
}

const { isSidebar, toggleLayoutMode } = useLayoutSettings();

const layoutChildren = (mainRoutes[0].children || []) as SidebarRoute[];

const openMenus = reactive<Record<string, boolean>>({});
const menuItems = computed<MenuItem[]>(() => {
  return layoutChildren.map((r) => {
    // r.meta.title 없으면, r.name 또는 r.path
    const label = String(r.meta?.title ?? r.name ?? r.path);
    const icon = r.meta?.icon ? String(r.meta.icon) : undefined;

    // 하위 라우트를 SubMenu 배열로 변환
    const subs: SubMenu[] = (r.children || [])
      .map((c) => {
        const childLabel = String(c.meta?.title ?? c.name ?? c.path);
        const childIcon = c.meta?.icon ? String(c.meta.icon) : undefined;
        const parentPath = r.path.replace(/^\//, "");
        const childPath = c.path.replace(/^\//, "");
        const to = `/${parentPath}/${childPath}`;
        return {
          name: String(c.name),
          label: childLabel,
          icon: childIcon,
          to,
        };
      })
      .filter((sub) => sub.name && sub.to);

    return {
      name: String(r.name),
      label,
      icon,
      // children이 있으면 to는 undefined, 없으면 “/r.path”형태
      to: subs.length ? undefined : `/${r.path.replace(/^\//, "")}`,
      children: subs.length ? subs : undefined,
    };
  });
});

function toggleMenu(name: string) {
  // 만약 해당 메뉴에 children이 없으면, 토글 없이 라우팅만 일어나게끔 처리
  console.log("toggle menu");
  const item = menuItems.value.find((m) => m.name === name);
  if (item && item.children && item.children.length > 0) {
    openMenus[name] = !openMenus[name];
  }
}
</script>

<template>
  <aside class="app-sidebar" v-if="isSidebar">
    <div class="app-sidebar__logo">
      <span>🌐 Logo</span>
    </div>

    <nav class="sidebar-nav">
      <ul class="menu-list">
        <!-- 1) 최상위 메뉴: LayoutShell 하위 children 순서대로 순회 -->
        <li v-for="item in menuItems" :key="item.name" class="menu-item">
          <!-- 2) 자식(children)이 있을 때: 접힘/펼침 가능 -->
          <div
            v-if="item.children && item.children.length"
            class="menu-link has-children"
            @click="toggleMenu(item.name)"
          >
            <!-- 아이콘이 있으면 보여주고, 없으면 빈 자리에 레이블만 출력 -->
            <span class="menu-label">{{ item.label }}</span>
            <span class="toggle-icon">
              {{ openMenus[item.name] ? "▼" : "▶" }}
            </span>
          </div>

          <!-- 3) 자식이 없으면 바로 RouterLink로 이동 -->
          <RouterLink
            v-else-if="item.to"
            :to="item.to"
            class="menu-link"
            active-class="active-link"
          >
            <span class="menu-label">{{ item.label }}</span>
          </RouterLink>

          <!-- 4) 하위 메뉴: openMenus[item.name]이 true일 때만 보임 -->
          <ul
            v-if="item.children && item.children.length"
            class="submenu-list"
            v-show="openMenus[item.name]"
          >
            <li
              v-for="sub in item.children"
              :key="sub.name"
              class="submenu-item"
            >
              <RouterLink
                :to="sub.to"
                class="submenu-link"
                active-class="active-link"
              >
                <span class="submenu-label">{{ sub.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
    <div class="app-sidebar__toggle">
      <button @click="toggleLayoutMode">헤더 모드로 전환</button>
    </div>
  </aside>
</template>

<style scoped lang="scss"></style>
