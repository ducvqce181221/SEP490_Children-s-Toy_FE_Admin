import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/configs/axios-client";
import { AxiosError } from "axios";

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadImageResponse {
  url: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType)) {
    return `Chỉ chấp nhận định dạng: ${ACCEPTED_IMAGE_TYPES.join(", ")}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Kích thước file không được vượt quá ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCampaignImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Interceptor đã unwrap response.data → response là UploadImageResponse
      const response = await axiosClient.post<UploadImageResponse, FormData>(
        "/campaigns/upload-image",
        formData,
        { timeout: 60000 } // Tăng timeout cho file upload
      );

      if (!response?.url) {
        toast.error("Upload thất bại: phản hồi từ server không hợp lệ.");
        return null;
      }

      return response.url;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[useCampaignImageUpload]", error);
      }

      // Chỉ toast lỗi 400 – interceptor đã xử lý 403/404/500
      const status = (error as AxiosError)?.response?.status;
      if (status === 400) {
        toast.error("File không hợp lệ. Vui lòng kiểm tra lại.");
      }

      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};