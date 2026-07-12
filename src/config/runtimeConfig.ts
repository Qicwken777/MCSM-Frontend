/**
 * 后端地址通过构建时环境变量 VITE_API_BASE_URL 指定。
 *
 * - 本地开发：留空即可，继续走 vite.config.ts 里的 dev proxy（/api、/upload_files、/socket.io
 *   转发到 localhost:23333），无需改动现有开发流程。
 * - 生产构建：
 *     1) 项目根目录放一个 .env.production 文件，写 VITE_API_BASE_URL=https://backend.example.com
 *     2) 或者在 CI / Cloudflare Pages 的 "环境变量" 里直接设置 VITE_API_BASE_URL，构建时会自动读取
 *   留空则保持原有行为：前端与后端同源，/api/xxx 解析为当前域名下的相对路径。
 *
 * 注意：这是构建时变量，写入的值会被打进最终产物里；换后端地址需要重新构建，
 * 不能像运行时配置那样直接替换某个静态文件。
 */
const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

/**
 * 获取构建时指定的后端地址（已去掉结尾斜杠）。
 * 未配置时返回空字符串，代表沿用"前端与后端同源"的原有行为。
 */
export function getApiBase(): string {
  return RAW_API_BASE;
}

/**
 * 解析出配置的后端 hostname 和 protocol。
 * 用于替代 tools/protocol.ts 中原本"假设面板与守护进程同源，
 * 直接使用 window.location"的逻辑——当守护进程以 127.0.0.1/localhost
 * 注册时，需要用这里配置的后端地址来还原成浏览器可访问的公网地址，
 * 而不是错误地拼接到前端自己的域名上。
 *
 * 未配置 VITE_API_BASE_URL 时返回 null，调用方应回退到 window.location（原有行为）。
 */
export function getBackendLocation(): { hostname: string; protocol: string } | null {
  if (!RAW_API_BASE) return null;
  try {
    const url = new URL(RAW_API_BASE);
    return { hostname: url.hostname, protocol: url.protocol };
  } catch (error) {
    console.error("[runtimeConfig] Invalid VITE_API_BASE_URL, ignored:", RAW_API_BASE, error);
    return null;
  }
}
