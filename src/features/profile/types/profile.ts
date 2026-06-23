export interface Profile {
  accountId: number;
  roleId: number;
  roleName: string;
  employeeCode: string | null;
  accountName: string;
  email: string;
  phoneNumber: string | null;
  dob: string | null;
  sexId: number | null;
  sexName: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateProfileRequest {
  imageUrl?: string | null;
  phoneNumber?: string | null;
  dob?: string | null;
  sexId?: number | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ProfileFormValues {
  imageUrl: string;
  phoneNumber: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Record<string, string[]>;
}
