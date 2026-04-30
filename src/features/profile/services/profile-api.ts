import axiosClient from "@/configs/axios-client";
import {
  Profile,
  UpdateProfileRequest,
} from "../types/profile";

type UploadImageResponse = {
  url: string;
};

export const profileApi = {
  getMyProfile: async (): Promise<Profile> => {
    return axiosClient.get<Profile>("/profiles/me");
  },

  updateMyProfile: async (payload: UpdateProfileRequest): Promise<Profile> => {
    return axiosClient.put<Profile, UpdateProfileRequest>("/profiles/me", payload);
  },

  uploadMyAvatar: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    return axiosClient.post("/profiles/me/avatar", formData);
  },
};
