import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
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
    if (process.env.NODE_ENV === "development") console.error(
      `[axiosClient] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error.response?.status,
      error.response?.data,
    );

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

export default axiosClient;