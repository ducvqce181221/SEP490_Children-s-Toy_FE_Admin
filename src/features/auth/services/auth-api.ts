import axiosClient from "@/configs/axios-client";
import type {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from "../types/auth";

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    return axiosClient.post<AuthResponse, LoginRequest>("/auth/login", payload);
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<void> => {
    return axiosClient.post<void, ForgotPasswordRequest>(
      "/auth/forgot-password",
      payload,
    );
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<void> => {
    return axiosClient.post<void, ResetPasswordRequest>(
      "/auth/reset-password",
      payload,
    );
  },

  logout: async (): Promise<void> => {
    return axiosClient.post<void>("/auth/logout");
  },
};
