"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

interface BlogFeaturedModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  blogTitle: string;
  initialIsFeatured: boolean;
  onClose: () => void;
  onConfirm: (isFeatured: boolean) => Promise<void>;
}

const BlogFeaturedModal: React.FC<BlogFeaturedModalProps> = ({
  isOpen,
  isSubmitting,
  blogTitle,
  initialIsFeatured,
  onClose,
  onConfirm,
}) => {
  const [selectedIsFeatured, setSelectedIsFeatured] = useState(initialIsFeatured);

  const handleConfirm = async () => {
    await onConfirm(selectedIsFeatured);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-h-[90vh] max-w-[560px] overflow-y-auto p-5 lg:p-8"
    >
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Featured Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Choose featured status for blog: <span className="font-semibold">{blogTitle}</span>
        </p>
      </div>

      <div className="space-y-3">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Featured Status
        </label>
        <select
          value={selectedIsFeatured ? "featured" : "not-featured"}
          onChange={(event) => setSelectedIsFeatured(event.target.value === "featured")}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
        >
          <option value="featured">Featured</option>
          <option value="not-featured">Not featured</option>
        </select>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </Modal>
  );
};

export default BlogFeaturedModal;
