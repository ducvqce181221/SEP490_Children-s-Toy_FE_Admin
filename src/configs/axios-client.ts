import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://localhost:7083/api", // Default fallback if not in env
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor – đính kèm token từ localStorage
axiosClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = undefined;
  }

  return config;
});

// Response interceptor – xử lý lỗi global theo HTTP status
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    // Dev-only logging để debug interceptor
    if (process.env.NODE_ENV === "development") {
      console.error(
        `[axiosClient] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.status,
        error.response?.data
      );
    }

    switch (error.response?.status) {
      case 400:
        // Validation error từ server – để service layer tự xử lý chi tiết
        break;
      case 401:
        // Token hết hạn – xóa token và redirect login
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
            localStorage.removeItem("access_token");
            localStorage.removeItem("account_info");
            const normalizedPath = window.location.pathname.replace(/\/+$/, "");
            const requestUrl = error.config?.url ?? "";
            const isLoginRequest = requestUrl.includes("/auth/login");
            if (!isLoginRequest && !normalizedPath.startsWith("/admin/login")) {
              window.location.href = "/admin/login";
            }
        }
        break;
      case 403:
        toast.error("Bạn không có quyền thực hiện thao tác này");
        break;
      case 404:
        toast.error("Không tìm thấy dữ liệu");
        break;
      case 500:
        toast.error("Lỗi server. Vui lòng thử lại sau");
        break;
      default:
        if (!error.response) {
          toast.error("Mất kết nối. Vui lòng kiểm tra mạng và thử lại");
        }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
