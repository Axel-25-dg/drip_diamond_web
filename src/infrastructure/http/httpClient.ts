import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/infrastructure/config/env";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";

/** Formato de respuesta uniforme que expone la API (core/responses.py) */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[] | string> | string;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[] | string> | string;

  constructor(message: string, status: number, errors?: Record<string, string[] | string> | string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];
const retryCounts = new WeakMap<InternalAxiosRequestConfig, number>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function buildRequestKey(config: InternalAxiosRequestConfig) {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  const data = config.data ? (typeof config.data === "string" ? config.data : JSON.stringify(config.data)) : "";
  return `${method}:${url}:${params}:${data}`;
}

function resolveQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 20000,
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if ((config.method || "get").toLowerCase() === "get") {
    const key = buildRequestKey(config);
    const existing = inFlightRequests.get(key);
    if (existing) {
      return Promise.reject({ __deduped: true, promise: existing } as any);
    }
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const config = response.config as InternalAxiosRequestConfig;
    if ((config.method || "get").toLowerCase() === "get") {
      const key = buildRequestKey(config);
      inFlightRequests.delete(key);
    }
    return response;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/login") || originalRequest?.url?.includes("/auth/refresh");

    if (status === 429 && originalRequest) {
      console.warn(`Rate limited (429): ${originalRequest.method ?? 'GET'} ${originalRequest.url}`);
      const attempt = (retryCounts.get(originalRequest) ?? 0) + 1;
      if (attempt <= 2) {
        retryCounts.set(originalRequest, attempt);
        const delay = 300 * attempt;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        return httpClient(originalRequest);
      }
    }

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(normalizeError(error));
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push((newToken) => {
            if (!newToken) return reject(normalizeError(error));
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(httpClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post<ApiEnvelope<{ access: string }>>(
          `${env.apiUrl}/auth/refresh/`,
          { refresh: refreshToken }
        );
        const newAccess = data.data?.access;
        if (!newAccess) throw new Error("No se pudo renovar la sesión");
        tokenStorage.set(newAccess);
        resolveQueue(newAccess);
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        const rStatus = (refreshError as AxiosError)?.response?.status;
        if (rStatus === 429) {
          console.warn("Auth refresh endpoint rate-limited (429). Expiring session to avoid loops.");
          resolveQueue(null);
          tokenStorage.clear();
          window.dispatchEvent(new CustomEvent("auth:session-expired"));
          return Promise.reject(normalizeError(error));
        }
        resolveQueue(null);
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error: AxiosError<ApiEnvelope<unknown>>): ApiError {
  const status = error.response?.status ?? 0;
  const envelope = error.response?.data;
  const message = envelope?.message || error.message || "Ocurrió un error inesperado.";
  return new ApiError(message, status, envelope?.errors);
}

/** Desempaqueta el sobre {success, message, data} devolviendo directamente `data`. */
export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data as T;
}

// GET deduplication wrapper: reuse in-flight Promise for identical GET requests
try {
  const _originalGet = httpClient.get.bind(httpClient) as any;
  httpClient.get = function (url: string, config?: InternalAxiosRequestConfig) {
    const key = `get:${url}:${config?.params ? JSON.stringify(config.params) : ""}`;
    const existing = inFlightRequests.get(key) as Promise<any> | undefined;
    if (existing) {
      return existing;
    }
    const promise = _originalGet(url, config).finally(() => {
      inFlightRequests.delete(key);
    });
    inFlightRequests.set(key, promise);
    return promise;
  } as any;
} catch (e) {
  // ignore if binding fails
}
