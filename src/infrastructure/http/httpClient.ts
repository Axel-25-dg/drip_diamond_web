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
  timeout: 35000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When data is FormData, delete Content-Type so browser sets boundary automatically
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
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

    // Clean in-flight GET request cache on error so future requests aren't blocked
    if (originalRequest && (originalRequest.method || "get").toLowerCase() === "get") {
      const key = buildRequestKey(originalRequest);
      inFlightRequests.delete(key);
    }

    // Auto-retry transient network errors, cold-start timeouts (ECONNABORTED), 502, 503, 504, or 429 rate limit
    const isNetworkOrTimeout = !error.response || status === 502 || status === 503 || status === 504 || error.code === "ECONNABORTED";
    if ((status === 429 || isNetworkOrTimeout) && originalRequest && (originalRequest.method || "get").toLowerCase() === "get") {
      const attempt = (retryCounts.get(originalRequest) ?? 0) + 1;
      if (attempt <= 2) {
        retryCounts.set(originalRequest, attempt);
        const delay = status === 429 ? 300 * attempt : 600 * attempt;
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
  
  // Sanitizar el mensaje para evitar que el servidor exponga stack traces o SQL/JSON crudos al frontend
  let message = envelope?.message || error.message || "Ocurrió un error inesperado de red.";
  
  // Si el mensaje contiene trazas de error interno del backend o HTML de servidor (ej 500 HTML), ocultarlo
  if (status >= 500 || message.includes("Traceback") || message.includes("Internal Server Error") || message.includes("<!DOCTYPE html>")) {
    message = "No se pudo procesar la solicitud en este momento. Por favor reintenta más tarde.";
  }

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
    const fakeConfig: InternalAxiosRequestConfig = {
      method: "get",
      url,
      params: config?.params,
      headers: (config?.headers || {}) as any,
    };
    const key = buildRequestKey(fakeConfig);
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
