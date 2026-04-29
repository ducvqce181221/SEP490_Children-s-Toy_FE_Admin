export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AccountInfo {
  accountId: number;
  accountName: string;
  email: string;
  imageUrl?: string;
  roleId: number;
  roleName: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  account: AccountInfo;
}

export interface ApiError {
  code: string;
  message: string;
  errors?: Record<string, string[]>;
}
