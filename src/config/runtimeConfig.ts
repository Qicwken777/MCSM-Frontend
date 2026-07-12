declare global {
  interface Window {
    __MCSM_CONFIG__?: {
      apiBase?: string;
    };
  }
}

function getRawApiBase(): string {
  return (window.__MCSM_CONFIG__?.apiBase || "").trim().replace(/\/+$/, "");
}

/**
 * 获取运行时指定的后端地址（已去掉结尾斜杠）。
 * 未配置时返回空字符串，代表沿用"前端与后端同源"的原有行为。
 */
export function getApiBase(): string {
  return getRawApiBase();
}

/**
 * 解析出配置的后端 hostname 和 protocol。
 * 用于替代 tools/protocol.ts 中原本"假设面板与守护进程同源，
 * 直接使用 window.location"的逻辑——当守护进程以 127.0.0.1/localhost
 * 注册时，需要用这里配置的后端地址来还原成浏览器可访问的公网地址，
 * 而不是错误地拼接到前端自己的域名上。
 *
 * 未配置 apiBase 时返回 null，调用方应回退到 window.location（原有行为）。
 */
export function getBackendLocation(): { hostname: string; protocol: string } | null {
  const base = getRawApiBase();
  if (!base) return null;
  try {
    const url = new URL(base);
    return { hostname: url.hostname, protocol: url.protocol };
  } catch (error) {
    console.error("[runtimeConfig] Invalid apiBase, ignored:", base, error);
    return null;
  }
}
