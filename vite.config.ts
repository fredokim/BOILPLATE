import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import type { Plugin } from "vite";

import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
import emitMetadata from "vite-plugin-emit-metadata";
export default defineConfig({
  plugins: [vue(), emitMetadata() as unknown as Plugin],
  css: {},
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/app/shared", import.meta.url)),
      "@dto": fileURLToPath(new URL("./src/app/dto", import.meta.url)),
      "@modules": fileURLToPath(new URL("./src/app/modules", import.meta.url)),
      "@layouts": fileURLToPath(new URL("./src/app/layouts", import.meta.url)),
      "@router": fileURLToPath(new URL("./src/app/router", import.meta.url)),
      "@store": fileURLToPath(new URL("./src/app/store", import.meta.url)),
    },
  },
});
