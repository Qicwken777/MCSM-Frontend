/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 后端面板地址（构建时变量）。留空表示前端与后端同源部署。
   * 例如：VITE_API_BASE_URL=https://backend.example.com
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
