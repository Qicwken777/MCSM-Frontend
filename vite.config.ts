import { fileURLToPath, URL } from "node:url";

import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { visualizer } from "rollup-plugin-visualizer";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1024,
    rollupOptions: {
      output: {
        manualChunks(path) {
          // Ant Design Vue
          if (path.includes("node_modules/ant-design-vue/es")) {
            return "ant-es";
          }

          if (path.includes("node_modules/ant-design-vue")) {
            return "ant";
          }

          // ECharts + zrender + tslib 必须放一起
          // 避免生产构建时 tslib helper 被拆分导致：
          // extendStatics is not a function
          if (
            path.includes("node_modules/echarts") ||
            path.includes("node_modules/zrender") ||
            path.includes("node_modules/tslib")
          ) {
            return "echarts";
          }

          // lodash
          if (path.includes("node_modules/lodash")) {
            return "lodash";
          }

          // Vue
          if (
            path.includes("node_modules/vue") ||
            path.includes("node_modules/@vue")
          ) {
            return "vue";
          }

          // xterm
          if (path.includes("node_modules/@xterm")) {
            return "xterm";
          }

          // codemirror
          if (path.includes("node_modules/@codemirror")) {
            return "codemirror";
          }

          // monaco
          if (path.includes("node_modules/monaco")) {
            return "monaco";
          }

          // htmlparser2
          if (path.includes("node_modules/htmlparser2")) {
            return "htmlparser2";
          }
        }
      }
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:23333",
        changeOrigin: true,
        ws: true
      },
      "/upload_files": {
        target: "http://localhost:23333",
        changeOrigin: true
      },
      "/socket.io": {
        target: "ws://localhost:23333",
        ws: true
      }
    }
  },

  plugins: [
    vue(),
    vueJsx(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false // css in js
        })
      ]
    }),
    visualizer({ emitFile: true, filename: "stats.html" })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@languages": fileURLToPath(new URL("./languages", import.meta.url))
    }
  },
  base: "./"
});
