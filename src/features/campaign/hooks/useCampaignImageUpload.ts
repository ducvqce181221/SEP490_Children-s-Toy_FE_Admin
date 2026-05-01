import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/configs/axios-client";

export const useCampaignImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosClient.post<{ url: string }>(
        "/campaigns/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.url;
    } catch (error) {
      toast.error("Tai anh that bai. Vui long thu lai.");
      if (process.env.NODE_ENV === "development") {
        console.error("[useCampaignImageUpload]", error);
      }
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};
