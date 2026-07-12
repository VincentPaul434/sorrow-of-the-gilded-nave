import { defineConfig } from "vite";

export default defineConfig({
  css: {
    postcss: {
      plugins: [],
    },
  },
  build: {
    target: "es2020",
  },
});
