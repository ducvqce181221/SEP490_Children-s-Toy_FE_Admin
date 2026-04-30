"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface BlogThumbnailPreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  onClose: () => void;
}

const BlogThumbnailPreviewModal: React.FC<BlogThumbnailPreviewModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[760px] p-5 lg:p-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Thumbnail Preview
        </h2>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[70vh] w-full object-contain"
          />
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No thumbnail available.
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};

export default BlogThumbnailPreviewModal;
