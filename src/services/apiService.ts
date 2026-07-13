import { getApiBase } from "@/config/runtimeConfig";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { reportErrorMsg } from "@/tools/validator";
import type { AxiosError, AxiosRequestConfig } from "axios";
import axios from "axios";
import EventEmitter from "eventemitter3";
import _ from "lodash";

axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
// 面板后端的登录态是基于 session cookie 的（token 只是额外的 CSRF 防护层，
// 不是身份识别本身）。跨域部署时，浏览器默认不会在请求里带上 Cookie，
// 必须显式开启 withCredentials，配合后端把 CORS 的 Allow-Credentials
// 打开、Set-Cookie 加上 SameSite=None; Secure，登录状态才能在跨域下保持住。
// 同源部署时这一行不受影响（同源请求本来就会带 Cookie）。
axios.defaults.withCredentials = true;
axios.interceptors.request.use(async (config) => {
  const { state } = useAppStateStore();
  if (!config.params) config.params = {};
  config.params.token = state.userInfo?.token;
  return config;
});

export interface RequestConfig extends AxiosRequestConfig {
  forceRequest?: boolean;
  errorAlert?: boolean;
}
interface ResponseDataRecord {
  timestamp: number;
  data: any;
}

interface PacketProtocol<T> {
  data: T;
  status: number;
  time: number;
}

class ApiService {
  private readonly event = new EventEmitter();
  private readonly responseMap = new Map<string, ResponseDataRecord>();
  private readonly RESPONSE_CACHE_TIME = 1000 * 2;
  private readonly REQUEST_CACHE_TIME = 100;

  public async subscribe<T>(config: RequestConfig): Promise<T | undefined> {
    if (!config.url) throw new Error("ApiService: RequestConfig: 'url' is empty!");

    config = _.cloneDeep(config);
    // filter and clean up expired cache tables
    this.responseMap.forEach((value, key) => {
      if (value.timestamp + this.RESPONSE_CACHE_TIME < Date.now()) {
        this.responseMap.delete(key);
      }
    });

    if (config.url?.startsWith("/")) {
      const apiBase = getApiBase();
      // apiBase 为空时保持原有行为：解析为当前域名下的相对路径（同源部署）
      // apiBase 有值时拼接为绝对地址，请求跨域后端
      config.url = apiBase ? apiBase + config.url : "." + config.url;
    }

    if (config.forceRequest === true) {
      config.params = config?.params || {};
      config.params._force = Date.now();
      return await this.sendRequest<T>(config);
    }

    const reqId = encodeURIComponent(
      [
        String(config.method),
        String(config.url),
        JSON.stringify(config.data ?? {}),
        JSON.stringify(config.params ?? {})
      ].join("")
    );

    return new Promise((resolve, reject) => {
      this.event.once(reqId, (data: any) => {
        if (data instanceof Error) {
          if (config.errorAlert === true) {
            reportErrorMsg(data.message);
          }
          reject(data);
        } else {
          data = _.cloneDeep(data);
          resolve(data);
        }
      });

      if (this.responseMap.has(reqId) && !config.forceRequest) {
        const cache = this.responseMap.get(reqId) as ResponseDataRecord;
        if (cache.timestamp + this.RESPONSE_CACHE_TIME > Date.now()) {
          return this.event.emit(reqId, cache.data);
        }
      }

      if (this.event.listenerCount(reqId) <= 1 || config.forceRequest === true) {
        this.sendRequest(config, reqId);
      }
    });
  }

  private async sendRequest<T>(config: RequestConfig, reqId?: string) {
    try {
      // Force request!
      if (!reqId) {
        const { data: result } = await axios<PacketProtocol<T>>(config);
        return result?.data;
      }

      // Request cache
      const startTime = Date.now();
      if (!config.timeout) config.timeout = 1000 * 30;
      const { data: result } = await axios<PacketProtocol<T>>(config);
      const endTime = Date.now();
      const reqSpeed = endTime - startTime;
      if (reqSpeed < this.REQUEST_CACHE_TIME) await this.wait(this.REQUEST_CACHE_TIME - reqSpeed);
      const realData = result.data;
      this.responseMap.set(reqId, {
        timestamp: Date.now(),
        data: realData
      });
      this.event.emit(reqId, realData);
    } catch (error: AxiosError | Error | any) {
      const axiosErr = error as AxiosError;
      const otherErr = error as Error | any;
      if (axiosErr?.response?.data) {
        const protocol = axiosErr?.response?.data as IPanelResponseProtocol;
        if (protocol.data && protocol.status !== 200) {
          this.throwRequestError(reqId, String(protocol.data));
          return;
        }
      }
      this.throwRequestError(reqId, otherErr);
    }
  }

  private throwRequestError(reqId?: string, error?: any) {
    if (!(error instanceof Error)) error = new Error(error);

    if (reqId) {
      this.event.emit(reqId, error);
    } else {
      throw error;
    }
  }

  private wait(time: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, time);
    });
  }
}

export const apiService = new ApiService();
