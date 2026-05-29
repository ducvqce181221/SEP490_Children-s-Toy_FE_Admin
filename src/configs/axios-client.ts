import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import toast from "react-hot-toast";


const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:7083/api";

const LOGIN_PATHS = ["/login", "/admin/login"] as const;

const SILENT_STATUSES = new Set([400, 401, 422]);

const HTTP_ERROR_MESSAGES: Record<number, string> = {
  403: "You do not have permission to perform this action.",
  404: "Data not found.",
  500: "Server error. Please try again later.",
};

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


axiosClient.interceptors.response.use(
  <T>(response: AxiosResponse<T>): T => response.data,

  (error: AxiosError) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[axiosClient] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response ? { status: error.response.status, data: error.response.data } : error.message
      );
    }

    if (!error.response) {
      toast.error("Connection lost. Please check your network and try again.");
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (!SILENT_STATUSES.has(status)) {
      toast.error(HTTP_ERROR_MESSAGES[status] ?? `An error occurred (${status}).`);
    }

    if (status === 401 && !error.config?.url?.includes("/auth/login")) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default axiosClient as UnwrappedAxiosInstance;