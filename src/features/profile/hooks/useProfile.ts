import { AxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import { profileApi } from "../services/profile-api";
import {
  ApiErrorResponse,
  Profile,
  UpdateProfileRequest,
  ValidationErrorResponse,
} from "../types/profile";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profileResponse = await profileApi.getMyProfile();
      setProfile(profileResponse);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      setError(
        axiosError.response?.data?.message ??
          "Unable to load profile. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadProfile]);

  const updateProfile = useCallback(async (payload: UpdateProfileRequest) => {
    setIsSaving(true);

    try {
      const response = await profileApi.updateMyProfile(payload);
      setProfile(response);
      return { success: true as const, data: response };
    } catch (error) {
      const axiosError = error as AxiosError<
        ValidationErrorResponse | ApiErrorResponse
      >;

      if (
        axiosError.response?.status === 400 &&
        axiosError.response.data &&
        "errors" in axiosError.response.data
      ) {
        return {
          success: false as const,
          message: axiosError.response.data.message,
          validationErrors: axiosError.response.data.errors,
        };
      }

      return {
        success: false as const,
        message:
          axiosError.response?.data?.message ??
          "Unable to update profile. Please try again.",
      };
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    profile,
    isLoading,
    isSaving,
    error,
    loadProfile,
    updateProfile,
  };
};
