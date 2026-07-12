import { getBackendLocation } from "@/config/runtimeConfig";
import { removeTrail } from "./string";

export function parseIp(ip: string) {
  if (ip.toLowerCase() === "localhost" || ip === "127.0.0.1") {
    // 面板与本地/全局守护进程通常同机部署，注册地址常为 127.0.0.1。
    // 若配置了跨域后端地址(apiBase)，说明浏览器当前域名并非后端所在域名，
    // 这时应还原为配置的后端 hostname，而不是前端自己的域名。
    return getBackendLocation()?.hostname ?? window.location.hostname;
  }
  return ip;
}

export type RemoteMappingEntry = {
  from: {
    addr: string;
    prefix: string;
  };
  to: {
    addr: string;
    prefix: string;
  };
};

export function mapDaemonAddress(remoteMappings: RemoteMappingEntry[]) {
  const loc = window.location;
  let addr = loc.host;
  if (loc.port === "") {
    if (loc.protocol === "http:") addr = `${addr}:80`;
    if (loc.protocol === "https:") addr = `${addr}:443`;
  }
  const match = remoteMappings.find(
    (entry) =>
      entry.from.addr === addr &&
      removeTrail(entry.from.prefix, "/") === removeTrail(loc.pathname, "/")
  );
  if (!match) return undefined;
  return match.to;
}

export function parseForwardAddress(addr: string, require: "http" | "ws") {
  // save its protocol header
  //ws://127.0.0.1:25565
  // 默认协议优先跟随配置的后端地址，未配置时才回退到当前页面协议（原有行为）
  let protocol = `${getBackendLocation()?.protocol ?? window.location.protocol}//`;
  const addrProtocolString = addr.toLocaleLowerCase();
  if (require === "http") {
    if (addrProtocolString.indexOf("ws://") === 0) protocol = "http://";
    else if (addrProtocolString.indexOf("wss://") === 0) protocol = "https://";
    else if (addrProtocolString.indexOf("http://") === 0) protocol = "http://";
    else if (addrProtocolString.indexOf("https://") === 0) protocol = "https://";
    else if (protocol === "https://") protocol = "https://";
    else protocol = "http://";
  }
  if (require === "ws") {
    if (addrProtocolString.indexOf("http://") === 0) protocol = "ws://";
    else if (addrProtocolString.indexOf("https://") === 0) protocol = "wss://";
    else if (addrProtocolString.indexOf("ws://") === 0) protocol = "ws://";
    else if (addrProtocolString.indexOf("wss://") === 0) protocol = "wss://";
    else if (protocol === "https://") protocol = "wss://";
    else protocol = "ws://";
  }

  // remove potentially redundant headers
  addr = deleteWebsocketHeader(deleteHttpHeader(addr));

  // port and ip are separated
  let daemonPort = null;
  let onlyAddr = null;
  if (addr.split(":").length === 2) {
    onlyAddr = addr.split(":")[0];
    daemonPort = parseInt(addr.split(":")[1].split("/")[0]);
    if (isNaN(daemonPort))
      throw new Error(`The address ${addr} failed to resolve, the port is incorrect`);
  } else {
    onlyAddr = addr;
  }

  let path = null;
  if (addr.indexOf("/") != -1) {
    path = addr.slice(addr.indexOf("/"));
  }

  // Reassemble the address based on the separated port and ip
  const checkAddr = onlyAddr.toLocaleLowerCase();
  if (checkAddr.indexOf("localhost") === 0 || checkAddr.indexOf("127.0.0.") === 0) {
    const hostname = getBackendLocation()?.hostname ?? window.location.hostname;
    addr = `${protocol}${hostname}${daemonPort ? `:${daemonPort}` : ""}${path ?? ""}`;
  } else {
    addr = `${protocol}${onlyAddr}${daemonPort ? `:${daemonPort}` : ""}${path ?? ""}`;
  }
  return addr;
}

// The ws address on the Daemon side is converted into an http address
export function daemonWsAddressToHttp(wsAddr = "") {
  if (wsAddr.toLocaleLowerCase().indexOf("ws://") === 0) {
    return `http://${wsAddr.slice(5)}`;
  } else if (wsAddr.toLocaleLowerCase().indexOf("wss://") === 0) {
    return `https://${wsAddr.slice(6)}`;
  }
  return wsAddr;
}

export function deleteWebsocketHeader(wsAddr: string) {
  if (wsAddr.toLocaleLowerCase().indexOf("ws://") === 0) {
    return `${wsAddr.slice(5)}`;
  } else if (wsAddr.toLocaleLowerCase().indexOf("wss://") === 0) {
    return `${wsAddr.slice(6)}`;
  }
  return wsAddr;
}

export function deleteHttpHeader(addr: string) {
  if (addr.toLocaleLowerCase().indexOf("http://") === 0) {
    return `${addr.slice(7)}`;
  } else if (addr.toLocaleLowerCase().indexOf("https://") === 0) {
    return `${addr.slice(8)}`;
  }
  return addr;
}

// The ws address on the Daemon side is converted to the local ws address
export function daemonWsAddressToWs(wsAddr = "") {
  if (
    wsAddr.toLocaleLowerCase().indexOf("ws://") !== 0 &&
    wsAddr.toLocaleLowerCase().indexOf("wss://") !== 0
  ) {
    return `ws://${wsAddr}`;
  }
  return wsAddr;
}
