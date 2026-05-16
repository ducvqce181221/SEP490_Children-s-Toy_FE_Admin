import { useState } from "react";
import toast from "react-hot-toast";
import axiosClient from "@/configs/axios-client";

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await axiosClient.post<{ url: string }>("/products/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      });

      return response.url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};
