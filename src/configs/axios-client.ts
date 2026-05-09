import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7083/api";

const LOGIN_PATHS = ["/login", "/admin/login"] as const;

const SILENT_STATUSES = new Set([400, 401]);

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu.",
  500: "Lỗi server. Vui lòng thử lại sau.",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearAuthStorage(): void {
  if (typeof window === "undefined") return; // SSR guard
  localStorage.removeItem("access_token");
  localStorage.removeItem("account_info");
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname.replace(/\/+$/, "");
  const isAlreadyOnLogin = LOGIN_PATHS.some((p) => currentPath.startsWith(p));

  if (!isAlreadyOnLogin) {
    const target = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
    window.location.replace(target);
  }
}

// ─── Axios instance ───────────────────────────────────────────────────────────
// Response interceptor returns `response.data`, but axios' typings still describe
// `AxiosResponse<T>`. This alias matches runtime behavior for callers.

type UnwrappedAxiosInstance = Omit<
  AxiosInstance,
  | "get"
  | "delete"
  | "head"
  | "options"
  | "post"
  | "put"
  | "patch"
  | "postForm"
  | "putForm"
  | "patchForm"
  | "request"
> & {
  request<T = unknown>(config: AxiosRequestConfig): Promise<T>;
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  options<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
  put<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
  patch<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
  postForm<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
  putForm<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
  patchForm<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    config?: AxiosRequestConfig<TBody>,
  ): Promise<TResponse>;
};

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ──────────────────────────────────────────────────────

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }

    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ─── Response interceptor ─────────────────────────────────────────────────────

axiosClient.interceptors.response.use(
  <T>(response: AxiosResponse<T>): T => response.data,

  (error: AxiosError) => {
    // eslint-disable-next-line no-console
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[axiosClient] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response ? { status: error.response.status, data: error.response.data } : error.message
      );
    }

    if (!error.response) {
      toast.error("Mất kết nối. Vui lòng kiểm tra mạng và thử lại.");
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (!SILENT_STATUSES.has(status)) {
      toast.error(HTTP_ERROR_MESSAGES[status] ?? `Đã xảy ra lỗi (${status}).`);
    }

    if (status === 401 && !error.config?.url?.includes("/auth/login")) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default axiosClient as UnwrappedAxiosInstance;