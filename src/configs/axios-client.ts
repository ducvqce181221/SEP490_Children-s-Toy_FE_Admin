import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL && process.env.NODE_ENV === "development") {
  // Dev-only warning to avoid calling frontend origin and getting 404.
  console.error(
    "[axios-client] Missing NEXT_PUBLIC_API_URL. Please configure .env.local",
  );
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = window.localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(error),
);

type RequestConfig = Omit<AxiosRequestConfig, "url" | "method" | "data">;

const axiosClient = {
  get: async <TResponse>(
    url: string,
    config?: RequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosInstance.get<TResponse>(url, config);
    return response.data;
  },
  post: async <TResponse, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: RequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosInstance.post<TResponse>(url, payload, config);
    return response.data;
  },
  put: async <TResponse, TPayload = unknown>(
    url: string,
    payload?: TPayload,
    config?: RequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosInstance.put<TResponse>(url, payload, config);
    return response.data;
  },
  delete: async <TResponse>(
    url: string,
    config?: RequestConfig,
  ): Promise<TResponse> => {
    const response = await axiosInstance.delete<TResponse>(url, config);
    return response.data;
  },
};

export default axiosClient;
